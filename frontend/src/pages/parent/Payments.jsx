import { useState, useEffect } from 'react';
import { FiDollarSign, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { feeAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';

const ParentPayments = () => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [parent, setParent] = useState(null);

  useEffect(() => {
    fetchChildPayments();
  }, []);

  const fetchChildPayments = async () => {
    try {
      setLoading(true);
      const userRes = await authAPI.getMe();
      const parentUser = userRes.data.data.user;
      setParent(parentUser);
      
      const childId = parentUser.parentInfo?.studentId || parentUser.parentInfo?.studentName; // Linked Child reference
      if (!childId) {
        toast.error('No linked student found for parent profile');
        setLoading(false);
        return;
      }

      // Load child details if needed, let's just query billing ledgers directly
      const res = await feeAPI.getLedgers({ studentId: childId });
      setLedgers(res.data.ledgers || res.data.data?.ledgers || []);
      setChild({ name: parentUser.parentInfo?.studentName || 'Child Account' });
    } catch (error) {
      console.error('Error fetching parent-child ledgers:', error);
      toast.error('Failed to load child active invoices');
    } finally {
      setLoading(false);
    }
  };

  // Load Razorpay checkout script dynamically
  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (ledger) => {
    try {
      toast.loading('Initiating secure checkout order...');
      const orderRes = await feeAPI.createPaymentOrder({ ledgerId: ledger._id });
      toast.dismiss();

      const { isMock, orderId, amount, key } = orderRes.data;

      // Load SDK
      const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptLoaded) {
        toast.error('Razorpay SDK loading failed. Please check internet connection.');
        return;
      }

      const options = {
        key: key || 'rzp_test_mock',
        amount: amount, // in paisa
        currency: 'INR',
        name: 'SHRI Educational World',
        description: `Fee payment: ${ledger.feeStructureId?.title || ledger.title || 'Tuition Dues'}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            toast.loading('Verifying transaction signatures...');
            const verifyPayload = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id || 'mock_pay_id',
              razorpaySignature: response.razorpay_signature || 'mock_sig',
              ledgerId: ledger._id
            };
            
            await feeAPI.verifyPayment(verifyPayload);
            toast.dismiss();
            toast.success('Payment completed successfully! Receipt generated.');
            fetchChildPayments();
          } catch (verifyError) {
            toast.dismiss();
            toast.error(verifyError.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: parent?.name,
          email: parent?.email,
          contact: parent?.phone
        },
        theme: {
          color: '#4F46E5'
        }
      };

      if (isMock) {
        // In mock mode, allow simulating successful checkout automatically for testing
        if (window.confirm(`[Mock Mode Enable] Click OK to simulate successful Razorpay checkout for ₹${(amount / 100).toFixed(2)}.`)) {
          // Trigger the handler directly with mocked parameters
          options.handler({
            razorpay_order_id: orderId,
            razorpay_payment_id: `mock_pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            razorpay_signature: `mock_sig_${Math.random().toString(36).substring(2, 12)}`
          });
        }
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }

    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to initialize payment checkout');
    }
  };

  const handleDownloadReceipt = (paymentId) => {
    const url = `${import.meta.env.VITE_API_URL}/v1/fees/payment/receipt/${paymentId}`;
    const token = localStorage.getItem('token');
    
    const link = document.createElement('a');
    link.href = `${url}?token=${token}`;
    link.target = '_blank';
    link.download = `Receipt_${paymentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8"><Loading /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Info Banner */}
      <div className="bg-card backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Child Dues & Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor invoices, payments, and print invoices for student: <strong className="text-indigo-500">{child?.name}</strong></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <FiDollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase">Pending Dues</p>
            <p className="text-lg font-black text-foreground">
              ₹{ledgers.reduce((sum, l) => l.status !== 'paid' ? sum + (l.totalFinalAmount - l.amountPaid) : sum, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Dues Ledgers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ledgers.map(ledger => {
          const duesRemaining = ledger.totalFinalAmount - ledger.amountPaid;

          return (
            <div key={ledger._id} className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition duration-200">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      ledger.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                      ledger.status === 'partially_paid' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {ledger.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm font-bold text-foreground">{new Date(ledger.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-foreground mb-2">{ledger.feeStructureId?.title || ledger.title || 'Term Tuition Dues'}</h3>
                
                {/* Itemized breaks */}
                <div className="bg-accent/40 rounded-xl p-3 space-y-1.5 my-4">
                  {ledger.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.feeHeadId?.name || 'Academic Fee'}</span>
                      <span className="font-semibold text-foreground">
                        ₹{item.finalAmount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-2 flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Dues Remaining</p>
                  <p className="text-lg font-black text-foreground">₹{duesRemaining.toFixed(2)}</p>
                </div>

                <div className="flex gap-2">
                  {ledger.status !== 'paid' ? (
                    <button
                      onClick={() => handleCheckout(ledger)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                    >
                      Pay Outstanding
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownloadReceipt(ledger.paymentId?._id || ledger.paymentId)}
                      className="flex items-center gap-1.5 bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      <FiDownload /> Print Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {ledgers.length === 0 && (
          <div className="col-span-full bg-card p-12 rounded-2xl border border-border text-center text-muted-foreground">
            <FiCheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
            <p className="font-bold text-foreground">All cleared!</p>
            <p className="text-sm text-muted-foreground mt-1">No pending billing structures for your child's account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentPayments;

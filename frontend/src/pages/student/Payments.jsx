import { useState, useEffect } from 'react';
import { FiDollarSign, FiFileText, FiDownload, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { feeAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Loading from '../../components/Loading';

const Payments = () => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchPaymentDues();
  }, []);

  const fetchPaymentDues = async () => {
    try {
      setLoading(true);
      const userRes = await authAPI.getMe();
      const me = userRes.data.data.user;
      setStudent(me);

      const res = await feeAPI.getLedgers({ studentId: me._id });
      setLedgers(res.data.ledgers || res.data.data?.ledgers || []);
    } catch (error) {
      console.error('Error fetching student invoices:', error);
      toast.error('Failed to load active dues');
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
            fetchPaymentDues();
          } catch (verifyError) {
            toast.dismiss();
            toast.error(verifyError.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: student?.name,
          email: student?.email,
          contact: student?.phone
        },
        theme: {
          color: '#4F46E5'
        }
      };

      // Always attempt to open the real Razorpay Checkout portal
      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          toast.error(resp.error?.description || 'Payment failed. Please try again.');
        });
        rzp.open();
      } catch (rzpError) {
        // Razorpay constructor failed (invalid key / SDK issue) — fall back to mock simulation
        console.warn('Razorpay portal could not open, falling back to mock:', rzpError);
        if (isMock && window.confirm(`[Mock Mode] Razorpay portal unavailable. Click OK to simulate a successful checkout for ₹${(amount / 100).toFixed(2)}.`)) {
          options.handler({
            razorpay_order_id: orderId,
            razorpay_payment_id: `mock_pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            razorpay_signature: `mock_sig_${Math.random().toString(36).substring(2, 12)}`
          });
        }
      }

    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to initialize payment checkout');
    }
  };

  const handleDownloadReceipt = (paymentId) => {
    if (!paymentId) {
      toast.error('Payment receipt record not found for this item.');
      return;
    }
    const targetId = typeof paymentId === 'object' ? (paymentId._id || paymentId.id) : paymentId;
    if (!targetId) {
      toast.error('Invalid receipt ID');
      return;
    }
    const url = `/api/v1/fees/payment/receipt/${targetId}`;
    const token = localStorage.getItem('token');
    
    const link = document.createElement('a');
    link.href = `${url}?token=${token}`;
    link.target = '_blank';
    link.download = `Receipt_${targetId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8"><Loading /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Academic Fees & Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">Review active invoice ledgers, clear outstanding dues, and view payment history.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <FiDollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase">Total Outstanding</p>
            <p className="text-lg font-black text-foreground">
              ₹{ledgers.reduce((sum, l) => l.status !== 'paid' ? sum + (l.totalFinalAmount - l.amountPaid) : sum, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Ledgers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ledgers.map(ledger => {
          const duesRemaining = ledger.totalFinalAmount - ledger.amountPaid;

          return (
            <div key={ledger._id} className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition duration-200">
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
                
                {/* Breakdowns */}
                <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 my-4">
                  {ledger.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.feeHeadId?.name || 'Academic Fee'}</span>
                      <span className="font-semibold text-foreground">
                        ₹{item.finalAmount.toFixed(2)} 
                        {item.discount > 0 && <span className="text-emerald-500 font-normal text-[10px] ml-1">(-₹{item.discount})</span>}
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
                      className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      Pay Outstanding
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownloadReceipt(ledger.paymentId?._id || ledger.paymentId)}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs px-4 py-2 rounded-xl transition"
                    >
                      <FiDownload /> Invoice Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {ledgers.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
            <FiCheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
            <p className="font-bold text-gray-700">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No active fee dues recorded for your account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;

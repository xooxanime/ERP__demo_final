import { Card, CardContent } from '../../components/ui/Card';
import { Construction } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function ComingSoon({ title = 'Coming Soon', description = 'This module is under development.', backPath }) {
  const navigate = useNavigate();
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
      </div>
      <Card>
        <CardContent className="py-20 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Construction className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">{description}</p>
          {backPath && <Button variant="outline" onClick={() => navigate(backPath)}>Go Back</Button>}
        </CardContent>
      </Card>
    </div>
  );
}

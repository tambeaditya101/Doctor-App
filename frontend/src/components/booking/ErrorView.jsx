import { Alert } from '../Alert';
import Button from '../Button';

export default function ErrorView({ err, onRetry, onBack }) {
  return (
    <div className='space-y-2'>
      <Alert kind='error'>{err}</Alert>
      <div className='flex gap-2'>
        <Button onClick={onRetry}>Retry</Button>
        <Button variant='secondary' onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

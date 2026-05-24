import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';

export default function ServerCreate() {
  return (
    <div>
      <PageHeader title="Create Server" />
      <Card>
        <div className="text-center py-16 text-slate-500">
          Multi-step server creation wizard will appear here.
        </div>
      </Card>
    </div>
  );
}

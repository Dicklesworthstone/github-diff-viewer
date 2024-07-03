import { useRouter } from 'next/router';
import DynamicDiffViewer from '../components/DynamicDiffViewer';

export default function Home() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4">
      <DynamicDiffViewer router={router} />
    </div>
  );
}
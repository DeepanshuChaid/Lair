// app/dashboard/[id]/page.tsx

import Toolbar from "@/components/board/toolbar/toolbar";

interface PageProps {
    params: Promise<{ id: string }>;
  }
  
  export default async function Page({ params }: PageProps) {
    // You must await params in Next.js 15+
    const { id } = await params;
  
    return (
      <div className="p-8">
        <Toolbar />
      </div>
    );
  }
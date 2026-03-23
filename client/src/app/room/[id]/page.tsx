// app/dashboard/[id]/page.tsx

interface PageProps {
    params: Promise<{ id: string }>;
  }
  
  export default async function Page({ params }: PageProps) {
    // You must await params in Next.js 15+
    const { id } = await params;
  
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Room ID: {id}</h1>
        <p className="text-muted-foreground">
          This page was generated dynamically for the ID: {id}
        </p>
      </div>
    );
  }
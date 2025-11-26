export default function MyEsimsPage() {
  // Fetch user esims
  const esims = [
      { iccid: '123456789', status: 'active', planName: 'US 1GB' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My eSIMs</h1>
      <div className="space-y-4">
          {esims.map((e: any) => (
              <div key={e.iccid} className="border p-4 rounded">
                  <h3>{e.planName}</h3>
                  <p>ICCID: {e.iccid}</p>
                  <p>Status: {e.status}</p>
              </div>
          ))}
      </div>
    </div>
  );
}


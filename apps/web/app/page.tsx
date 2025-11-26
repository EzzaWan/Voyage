import Link from 'next/link';

export default async function Home() {
  // Fetch countries from API
  // const countries = await fetch('http://localhost:3001/api/countries').then(res => res.json());
  const countries = [{ locationCode: 'US', locationName: 'United States' }, { locationCode: 'JP', locationName: 'Japan' }];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Select Destination</h1>
      <div className="grid grid-cols-2 gap-4">
        {countries.map((c: any) => (
          <Link key={c.locationCode} href={`/countries/${c.locationCode}`} className="border p-4 rounded hover:bg-gray-50">
            {c.locationName}
          </Link>
        ))}
      </div>
    </div>
  );
}


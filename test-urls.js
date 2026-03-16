const urls = [
  'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1588693822189-0ae6b772cfff?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2066&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497985458315-74c10ac25027?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521798548303-3a7cc3dbfc96?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502005097973-f5a1e582846d?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1616489953149-8ba5dc422934?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1628189689408-ddad24ecca74?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1626023301053-91129f1bcfad?q=80&w=2000&auto=format&fit=crop',
  'https://plus.unsplash.com/premium_photo-1678235212560-4c3e8a75e8db?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498146831523-fbe41ac02ffc?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604709177227-04dc32ad80fa?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop'
];

async function checkUrls() {
  for (let url of urls) {
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      console.log(resp.status, url.substring(0, 50) + '...');
    } catch(e) { console.log('ERROR:', url) }
  }
}
checkUrls();

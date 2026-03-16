const urls = [
  'https://images.unsplash.com/photo-1463627581515-562214418fc3?q=80&w=2000&auto=format&fit=crop', // 1
  'https://images.unsplash.com/photo-1583847268964-b28ce7f38d17?q=80&w=2000&auto=format&fit=crop', // 2
  'https://images.unsplash.com/photo-1532323544222-650817bac50b?q=80&w=2000&auto=format&fit=crop', // 3
  'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?q=80&w=2000&auto=format&fit=crop', // 4
  'https://images.unsplash.com/photo-1489081552559-0df48da9eec3?q=80&w=2000&auto=format&fit=crop', // 5
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=2000&auto=format&fit=crop', // 6
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop', // 7 (this one works)
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2000&auto=format&fit=crop', // 8 (works)
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2000&auto=format&fit=crop', // 9 (works)
  'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=2000&auto=format&fit=crop' // 10 (works)
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

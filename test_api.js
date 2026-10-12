async function main() {
  try {
    const bRes = await fetch('http://localhost:8081/api/public/owner/bookings');
    const bookings = await bRes.json();
    console.log('Bookings count:', bookings.length);
    if (bookings.length > 0) {
      console.log('First booking:', JSON.stringify({
        id: bookings[0].id,
        bookingCode: bookings[0].bookingCode,
        homestayId: bookings[0].homestayId,
        homestayName: bookings[0].homestayName,
        guestName: bookings[0].guestName,
        roomName: bookings[0].roomName,
        status: bookings[0].status
      }, null, 2));
    }

    const mRes = await fetch('http://localhost:8081/api/public/owner/missions');
    const missions = await mRes.json();
    console.log('Missions count:', missions.length);

    const sRes = await fetch('http://localhost:8081/api/public/owner/missions/submissions');
    const subs = await sRes.json();
    console.log('Submissions count:', subs.length);
    if (subs.length > 0) {
      console.log('First submission:', JSON.stringify(subs[0], null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
main();

export async function queryDb(userId) {
    if (userId != undefined) {
        console.log('fetching user data');
        let apiRes = await fetch('http://localhost:1111/' + userId);
        let data = await apiRes.json();
        return data;
    } else {
        console.log('Not fetching user data');
        return '';
    }
}

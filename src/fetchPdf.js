export async function fetchPdf(template) {
    console.log('FETCHING PDF');
    let apiRes = await fetch('http://localhost:1111/pdf', {
        method: 'POST',
        body: JSON.stringify(template),
        headers: {
            'Content-Type': 'application/json', // the type of content I'm sending
            Accept: 'application/pdf', // the type of content I want back from the server
        },
    });
    if (!apiRes.ok) {
        throw new Error(`Failed to fetch products pdf - ${apiRes.statusText}`);
    }
    const blob = await apiRes.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'products.pdf';
    link.click();
    URL.revokeObjectURL(objectUrl);
}

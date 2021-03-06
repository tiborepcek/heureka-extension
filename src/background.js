// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });
console.log("alive");

chrome.extension.onMessage.addListener((request, sender, sendResponse) => {
  const { query, payload, meta } = request;
  callToHeureka(query, payload, meta).then(sendResponse);

  return true;
});

async function callToHeureka(
  query,
  payload,
  { hostname = "www.alza.cz" } = {}
) {
  const [tld] = hostname.split(".").reverse();
  const url = `https://api.heureka.${tld}`;

  switch (query) {
    case "Najdi mi prosimtě tohle zbožíčko": {
      return await searchProductsOnHeureka(payload, { apiUrl: url });
    }
  }
}

async function searchProductsOnHeureka(term, { apiUrl } = {}) {
  // Hack: Using Heureka's autocomplete suggestions
  console.log(`${apiUrl}/head-gateway/search?term=${term}`);
  const result = await fetch(
    // ... but now its regular api, ❤️ Heureka
    `${apiUrl}/head-gateway/search?term=${term}`
  );

  try {
    const {
      products: { result: foundProducts },
    } = await result.json();
    console.log("Products found on Heureka", foundProducts);

    // return all found products
    return foundProducts;
  } catch (error) {
    console.error(`It seems like  Heureka's API has change`);
  }
}

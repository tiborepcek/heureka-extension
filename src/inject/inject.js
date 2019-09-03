chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval = setInterval(function() {
        if (document.readyState === 'complete') {
            clearInterval(readyStateCheckInterval);
            liveTimeBaby();
        }
    }, 10);
});

async function liveTimeBaby() {
    const productName = scrapeProductName();
    const productPrice = scrapeProductPrice();

    if (!productName) {
        console.log('Product name not found.');
        return;
    }

    // Background script returns array of found product but we use just the first one for now
    const [foundProduct] = await callToBackgroundScript(
        'Najdi mi prosimtě tohle zbožíčko',
        productName,
    );

    if (!foundProduct) {
        console.log('No product found.', productName);
    }

    const heurekaPrice = foundProduct
        ? parsePrice(foundProduct.price)
        : Infinity;

    if (productPrice) console.log({ productName, productPrice, heurekaPrice });

    const productIsNotCheaper = heurekaPrice >= productPrice;

    if (productIsNotCheaper) {
        console.log('Product is not cheaper');
    }

    const boxRoot = makeHeurekaRoot();
    if (boxRoot) {
        const box = makeHeurekaBox({
            product: foundProduct,
            productIsNotCheaper,
        });
        boxRoot.appendChild(box);
    }
}

function callToBackgroundScript(query, payload) {
    return new Promise(resolve => {
        chrome.extension.sendMessage({ query, payload }, resolve);
    });
}

/**
 *  Shop page (DOM) modificators
 *  Works just on Alza.cz for now
 *
 *  Heureka = extension namespace
 */

const makeHeurekaRoot = () => {
    // 1. find place above buy button
    const originBuyButtonContainer = document.getElementById('pricec');

    if (!originBuyButtonContainer) return null;

    // 2. create box container
    const heurekaContainer = document.createElement('div');
    heurekaContainer.classList.add('HeurekaContainer'); // easy to read, mby use some encryption to impair detection?
    // 3. paste box container above found button
    originBuyButtonContainer.prepend(heurekaContainer);

    return heurekaContainer;
};
const makeHeurekaBox = ({ product, productIsNotCheaper }) => {
    const box = document.createElement('div');

    box.classList.add('HeurekaBox');

    const title = document.createElement('span');
    title.classList.add('HeurekaBox__Title');

    if (!product) {
        title.classList.add('HeurekaBox__Title--no-result');
        title.innerHTML = `${sadSmileIcon}Srovnání cen tohoto produktu není na Heurece dostupné`;
        box.appendChild(title);
        return box;
    }

    if (productIsNotCheaper) {
        title.classList.add('HeurekaBox__Title--no-result');
        title.innerHTML = `${sadSmileIcon}Produkt na Heurece není levnější `;
        box.appendChild(title);
        return box;
    }

    title.innerText = 'Produkt je na Heurece levnejší!';

    const productName = document.createElement('h2');
    productName.innerText = product.name;
    productName.classList.add('HeurekaBox__ProductName');

    const productDescription = document.createElement('p');
    productDescription.innerText = product.short_description;
    productDescription.classList.add('HeurekaBox__ProductDescription');

    const productPrice = document.createElement('span');
    productPrice.innerText = product.price;
    productPrice.classList.add('HeurekaBox__ProductPrice');

    const button = document.createElement('a');
    button.innerHTML =
        '<i class="HeurekaBox__ButtonIcon"></i>Zobrazit na Heurece';
    button.classList.add('HeurekaBox__Button');
    button.setAttribute('href', product.desktop_url);
    button.setAttribute('target', '_blank');

    // Yeah, old fashion style
    box.appendChild(title);
    box.appendChild(productName);
    box.appendChild(productDescription);
    box.appendChild(button);
    box.appendChild(productPrice);

    return box;
};

const scrapeProductName = () => document.querySelector('h1').innerText;
const scrapeProductPrice = () => {
    let element = document.querySelector('.price_withVat');

    if (!element) {
        // Special price, different way how to display price
        element = document.querySelector('#prices .c2');
    }

    return element ? parsePrice(element.innerText) : null;
};

const sadSmileIcon = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.0002 36.6667C29.2049 36.6667 36.6668 29.2048 36.6668 20C36.6668 10.7953 29.2049 3.33334 20.0002 3.33334C10.7954 3.33334 3.3335 10.7953 3.3335 20C3.3335 29.2048 10.7954 36.6667 20.0002 36.6667Z" stroke="#FF7A04" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M13.3335 25H26.6668" stroke="#FF7A04" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15 15H15.0167" stroke="#FF7A04" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M25 15H25.0167" stroke="#FF7A04" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

/**
 * parse-price - returns a Number from a localized price string
 *
 * @version 1.1.8
 * @link https://github.com/caiogondim/parse-price.js#readme
 * @author Caio Gondim
 * @license MIT
 */
function parsePrice(string) {
    function t(e) {
        return e.replace(/[^\d]/g, '');
    }
    function n(e) {
        return e.replace(/[^\d.,]/g, '').replace(/[.,]$/, '');
    }
    function o(e) {
        for (
            var r = n(e), t = '0' === r[r.length - 1], o = r.length;
            o > 0;
            o--
        ) {
            if (r.length - o + 1 > 3 && t) return;
            var i = r[o - 1];
            if (-1 !== [',', '.'].indexOf(i)) return i;
        }
    }
    function _parsePrice(e) {
        var r = String(e),
            n = '00',
            i = o(r);
        i && (n = r.split(i)[1]);
        var f = r.split(i)[0];
        return Number(t(f) + '.' + t(n));
    }

    return _parsePrice(string);
}

import './style.css';

import Handlebars from 'handlebars';
import { queryDb } from './queryDb.js';
import { fetchPdf } from './fetchPdf.js';

import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();

import estadoDeCuentaUrl from '/estado-de-cuenta.hbs?url';
import estadoDeCuentaAmpliadoUrl from '/estado-de-cuenta-ampliado.hbs?url';
import indexUrl from '/index.hbs?url';

async function makeTexts() {
    let estadoDeCuentaRes = await fetch(estadoDeCuentaUrl);
    let estadoDeCuentaAmpliadoRes = await fetch(estadoDeCuentaAmpliadoUrl);
    let estadoDeCuentaText = await estadoDeCuentaRes.text();
    let estadoDeCuentaAmpliadoText = await estadoDeCuentaAmpliadoRes.text();
    let indexRes = await fetch(indexUrl);
    let indexText = await indexRes.text();
    let templates = {
        estadoDeCuenta: estadoDeCuentaText,
        estadoDeCuentaAmpliado: estadoDeCuentaAmpliadoText,
        index: indexText,
    };
    return templates;
}
let templates = await makeTexts();
Handlebars.registerHelper('sumarSaldos', (saldos) => {
    let total = 0;
    if (saldos != undefined && saldos[0] != undefined) {
        total =
            saldos[0].SaldoCSTitular +
            saldos[0].SaldoCSAdherente +
            saldos[0].SaldoServicios +
            saldos[0].SaldoCreditos;
        if (saldos[0].ImporteSinAplicar) {
            total -= saldos[0].ImporteSinAplicar;
        }
    }
    return total;
});
Handlebars.registerHelper('renderMin', function (variableOne, variableTwo) {
    if (variableOne < variableTwo) {
        return variableOne;
    } else {
        return variableTwo;
    }
});
Handlebars.registerHelper('formatDate', (timestamp) => {
    if (timestamp == '' || timestamp == null) {
        return '';
    }
    let date = new Date(timestamp);
    let simplified = new Intl.DateTimeFormat('es-AR').format(date);
    return simplified;
});
Handlebars.registerHelper('groupBy', function (arr, selectedKey, options) {
    let sortStore = [];
    let filteredCategories = [];
    if (arr != undefined) {
        for (let i = 0; i < arr.length; i++) {
            let currentCategory = arr[i][selectedKey];
            let lastCategory = '';
            if (i != 0) {
                lastCategory = arr[i - 1][selectedKey];
            }
            if (
                currentCategory != lastCategory &&
                filteredCategories.indexOf(currentCategory) === -1
            ) {
                filteredCategories.push(currentCategory);
                let filteredArray = arr.filter((element) => {
                    return element[selectedKey] == currentCategory;
                });
                sortStore.push(filteredArray);
            }
        }
    }
    sortStore.forEach((category) => {
        let sortedCategory = category.sort((a, b) => {
            return new Date(b.FechaVto) - new Date(a.FechaVto);
        });
        return sortedCategory;
    });

    return sortStore;
});
Handlebars.registerHelper('ifEquals', function (a, b, options) {
    if (a === b) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
Handlebars.registerHelper(
    'compare',
    function (variableOne, comparator, variableTwo) {
        if (eval(variableOne + comparator + variableTwo)) {
            return true;
        } else {
            return false;
        }
    }
);
Handlebars.registerHelper('format', function (number) {
    let rounder = new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    });
    let formatter = new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    let numString;
    if (number % 1 == 0) {
        numString = rounder.format(number);
    } else {
        numString = formatter.format(number);
    }
    let formated = numString.split(' ').join('');
    return formated;
});
Handlebars.registerHelper('minus', function (value) {
    let newValue = value * -1;
    return newValue;
});
Handlebars.registerHelper('today', function () {
    let today = Date.now();
    let simplified = new Intl.DateTimeFormat('es-AR').format(today);
    return simplified;
});

let estadoDeCuentaTemplate = Handlebars.compile(templates.estadoDeCuenta);
let estadoDeCuentaAmpliado = Handlebars.compile(
    templates.estadoDeCuentaAmpliado
);
let homeTemplate = Handlebars.compile(templates.index);

let template = '';

let pathSplit = window.location.pathname.split('/');
let userId = pathSplit[1];
let pdfCondition = pathSplit.indexOf('pdf') != -1;
let expandCondition = pathSplit.indexOf('ampliar') != -1;
let secondPath = window.location.pathname.split('/')[2];

let dataObj = await queryDb(userId);

if (!expandCondition) {
    template = estadoDeCuentaTemplate(dataObj);
} else if (expandCondition) {
    template = estadoDeCuentaAmpliado(dataObj);
}
if (userId == '') {
    template = homeTemplate(dataObj);
}
document.querySelector('#app').innerHTML = `${template}`;
if (userId == '') {
    let btn = document.getElementById('btn-consulta');
    btn.addEventListener('click', (e) => {
        let input = document.getElementById('input-id-socio');
        let targetUrl = `/${input.value}`;
        window.open(targetUrl);
    });
}
if (pdfCondition) {
    let page = await browser.newPage();
    page.setContent(template);
    let file = await page.pdf();
}

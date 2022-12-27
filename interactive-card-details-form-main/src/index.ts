
import { Model } from './Types/Model';
import { InputKey } from './Types/InputKey';

let models: Model | null = null;

function init() {
    const inputs = document.querySelectorAll('.form_section > input');
    console.log('inputs => ', inputs);

}



function getFormHandler(key: InputKey, id: string): Model {
    return {
        key,
        id,
        onUpdate: formInputUpdate[key],
        placeholder: cardPlaceholder[key],
        value: '',
        validationRules: [] // formInputValidationRules[key],
    };
}

// ---------------------------
// Helpers
// ---------------------------

const cardPlaceholder = {
    cardNumber: '0000 0000 0000 0000',
    cardholderName: 'Jane Appleseed',
    expirationMonth: '00',
    expirationYear: '00',
    cvc: '000'
}

// ---------------------------
// On Update
// ---------------------------

const formInputUpdate = {
    cvc: () => { },
    cardholderName: () => { },
    cardNumber: () => { },
    expirationMonth: () => { },
    expirationYear: () => { },
}


// ---------------------------
// Validation Rules
// ---------------------------


const formInputValidationRules = {
    cardholderName: [required, cardholderNameFormat],
    cardNumber: [required, cardNumberFormat],
    expirationMonth: [required],
    expirationYear: [required],
    cvc: [required],
};

const cardholderName = /^([A-Z][a-z]* [A-Z][a-z]*)$/;
const cardNumber = /^([0-9]{16})$/;

function required(v: string) {
    return !!v || 'Can\'t be blank';
}

function regExpCheck(v: string, regExp: RegExp) {
    return !!v.match(regExp);
}

function cardholderNameFormat(v: string) {
    return regExpCheck(v, cardholderName) || 'Wrong format';
}


function cardNumberFormat(v: string) {
    return regExpCheck(v, cardNumber) || 'Wrong format';
}

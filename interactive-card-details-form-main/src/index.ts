const CREADIT_CARD_KEYS = ['cardNumber', 'cardholderName', 'expirationMonth', 'expirationYear', 'cvc'];
document.getElementById('validateBtn').addEventListener('click', validate);
const models: Model[] = CREADIT_CARD_KEYS.map((key) => new Model(key));

function validate() {
    const
}

// ---------------------------
// Model
// ---------------------------

class Model {
    constructor(key) {
        this.key = key;
        this.placeholder = cardPlaceholder[key];
        this.validationRules = formInputValidationRules[key];

        this.setListener();
    }

    key: string;
    placeholder: string;
    validationRules: Function[];
    value = '';
    errors: string[] = [];
    realTimeValidation = false;

    update(value: string) {
        this.value = value;
        this.errors = this.getErrors();

        this.updateCardSlot(this.value || this.placeholder);
        if (this.realTimeValidation) this.validate();
    }

    // DOM manipulations
    private updateCardSlot(value: string) {
        this.getDisplaySlot().innerText = value;
    }

    private getDisplaySlot(): HTMLInputElement {
        return document.getElementById(this.key) as HTMLInputElement;
    }

    // Form handling
    private setListener() {
        this.getInput().addEventListener('input', (event) => this.update((event.target as HTMLInputElement).value));
    }

    private getInput(): HTMLElement {
        return document.getElementById(this.key + 'Input');
    }

    // Error handling
    private validate(): boolean {
        if (this.errors.length) {
            this.displayErrors();
            return false;
        }

        return true;
    }

    private getErrors(): string[] {
        return this.validationRules.reduce((acc, rule) => {
            const ruleResult: string | boolean = rule(this.value);
            return ruleResult === true ? acc : [...acc, ruleResult];
        }, []);
    }
    private getErrorSlot() {
        return document.getElementById(this.key + 'ErrorsSlot');
    }
    private displayErrors() {
        this.errors.forEach(errorTxt => {
            const errorElement = document.createElement('span');
            errorElement.innerHTML = errorTxt;
            errorElement.classList.add('error');

            this.getErrorSlot().appendChild(errorElement);
            const input = this.getInput();
            if (!input.classList.contains('input--error')) input.classList.add('input--error');
        });
    }

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

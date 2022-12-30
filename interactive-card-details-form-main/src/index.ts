import { ReactiveForm } from './Types/ReactiveForm';
import { InputModelObservers } from './Types/InputModelObservers';
const CREADIT_CARD_KEYS = ['cardNumber', 'cardholderName', 'expirationMonth', 'expirationYear', 'cvc'];
document.getElementById('validateBtn').addEventListener('click', validate);
const models: Model[] = CREADIT_CARD_KEYS.map((key) => new Model(key));


// ---------------------------
// Classes
// ---------------------------


export class Form {
    constructor(fields: ReactiveForm[], validationBtnId: string, realTimeValidation = false) {

        this.realTimeValidation = realTimeValidation;
        this.validationBtnId = validationBtnId;
        const { inputs, DOMSlots } = fields
            .reduce((acc, { useDOMSlot, key, ...input }) => {

                const observers: InputModelObservers = {
                    onValueChanges: useDOMSlot ? (value: string) => this.udpateDOMSlot(value, key) : () => { },
                    onErrorsChanges: realTimeValidation ? (errors: string[]) => this.handleErrors(errors, key) : () => { },
                };

                //! Make it readable
                acc.inputs[key] = this.createInput(key, input.placeholder, observers, input.validationRules, input.value, input.allowsMultipleErrors);
                if (useDOMSlot) acc.DOMSlots[key] = new DomController(key + 'Slot', input.value);

                return acc;
            }, { inputs: {} as Record<string, InputModel>, DOMSlots: {} as Record<string, DomController> });

        this.inputs = inputs;
        this.DOMSlots = DOMSlots;
    }

    validationBtnId: string;
    inputs: Record<string, InputModel>;
    DOMSlots: Record<string, DomController> = {};

    _realTimeValidation: boolean;

    private _isValid = false;

    private get realTimeValidation() {
        return this._realTimeValidation;
    }

    private set realTimeValidation(activated) {
        this._realTimeValidation = activated;
        if (this._realTimeValidation) this.updateInputObservers('onErrorsChanges', this.udpateDOMSlot);
    }

    updateInputObservers(eventName: keyof InputModelObservers, callback: Function) {
        Object.entries(this.inputs).forEach(([key, input]) => input.updateObserver(eventName, (value) => callback(value, key)));
    }

    private handleErrors(errors, key) {
        this.displayErrorMessages(errors, key + 'Error');

        if (errors.length) {
            this.isValid = this.areAllInputsValid();
        }
    }

    areAllInputsValid(): boolean {
        return Object.values(this.inputs).every(({ isValid }) => isValid);
    }

    displayErrorMessages(errors: string[], id) {
        const container = this.getErrorContainer(id);

        container.innerHTML = '';

        if (errors.length) {
            errors.forEach(error => {
                const slot = document.createElement('span');
                slot.classList.add('text--error'); //! Add the class to the CSS
                slot.innerText = error;
                container.appendChild(slot);
            });
        }
    }

    private getErrorContainer(id): HTMLDivElement {
        return document.getElementById(id) as HTMLDivElement;
    }

    private get validationBtn(): HTMLButtonElement {
        //? Could handle the enter key input
        return document.getElementById(this.validationBtnId) as HTMLButtonElement;
    }

    private set isValid(isValid) {
        this.isValid = isValid;

        if (this.isValid) {
            if (this.validationBtn.disabled) this.validationBtn.removeAttribute('disbled');

        } else {
            this.validationBtn.setAttribute('disabled', 'true');
            this.realTimeValidation = true;
        }   
    }

    createInput(key: string, placeholder: string, observers: InputModelObservers, validationRules?: Function[], value?: string, allowsMultipleErrors?: boolean): InputModel {
        const id = key + 'Input';
        return new InputModel(id, placeholder, observers, validationRules, value, allowsMultipleErrors);
    }

    udpateDOMSlot(value: string, key: string) {
        this.DOMSlots[key].value = value;
    }
}


export class DomController { //* Will embody the Cards text slots
    constructor(id: string, value: string) {
        this.id = id;
        this._value = value;
    }
    id: string;

    _value: string;

    set value(v: string) {
        this._value = v;
        this.updateDOM();
    }

    private updateDOM() {
        this.slot.innerText = this.value;
    }

    private get slot(): HTMLElement {
        return document.getElementById(this.id);
    }


}


export class InputModel {
    constructor(id: string, placeholder: string, observers: InputModelObservers, validationRules?: Function[], value?: string, allowsMultipleErrors?: boolean) {
        this.id = id;
        this.placeholder = placeholder;
        this.observers = observers;
        this.allowsMultipleErrors = allowsMultipleErrors;


        if (value) {
            if (validationRules) this._validationRules = validationRules;
            this.value = value;
        }

        this.setDOMEventListener();
    }

    id: string;
    placeholder: string;
    errors: string[] = [];
    observers: InputModelObservers = null;
    allowsMultipleErrors = false;

    _validationRules: Function[] = [];
    _value: string = '';

    // Utility 
    updateObserver(key: keyof InputModelObservers, callback: Function) {
        this.observers[key] = callback;
    }

    // Value
    set value(v) {
        this._value = v;
        this.observers.onValueChanges(this.value || this.placeholder);

        if (this.validationRules.length) this.validate(); //! Maybe give the validation triggering to the Form
    }

    get value() {
        return this._value;
    }

    // Errors
    validate() {
        this.errors = this.validationRules.map(rule => rule(this.value)).filter(result => result !== true);
        this.observers.onErrorsChanges(this.allowsMultipleErrors ? this.errors : this.errors.slice(0, 1));
        //! Maybe merge this with isValid to let the Form decide when to check validity
    }

    set validationRules(rules: Function[]) {
        this._validationRules = rules;
        this.validate;
    }

    get isValid() {
        return !this.errors.length;
    }


    // DOM
    private setDOMEventListener() {
        this.input.addEventListener('input', (event) => this.value = (event.target as HTMLInputElement).value);
    }

    private get input(): HTMLElement {
        return document.getElementById(this.id);
    }
}




class Model_LEGACY {
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

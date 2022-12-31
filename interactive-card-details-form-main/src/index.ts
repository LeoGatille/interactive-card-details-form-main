import { ReactiveForm } from './Types/ReactiveForm';
import { InputModelObservers } from './Types/InputModelObservers';

// ---------------------------
// Classes
// ---------------------------

export class Form {
    constructor(fields: ReactiveForm[], validationBtnId: string, validityObserver: Function, realTimeValidation = false,) {

        this.realTimeValidation = realTimeValidation;
        this.validationBtnId = validationBtnId;
        this.validityObserver = validityObserver;

        const { inputs, DOMSlots } = fields
            .reduce((acc, { useDOMSlot, key, ...input }) => {

                const observers: InputModelObservers = {
                    onValueChanges: useDOMSlot ? (value: string) => this.udpateDOMSlot(value, key) : () => { },
                    onErrorsChanges: realTimeValidation ? (errors: string[]) => this.handleErrors(errors, key) : () => { },
                };

                //! Make it readable
                acc.inputs[key] = this.createInput(key, input.placeholder, observers, input.validationRules, input.value, input.allowsMultipleErrors);
                if (useDOMSlot) acc.DOMSlots[key] = new ReactiveDomSlot(key + 'Slot', input.value);

                return acc;
            }, { inputs: {} as Record<string, InputModel>, DOMSlots: {} as Record<string, ReactiveDomSlot> });

        this.inputs = inputs;
        this.DOMSlots = DOMSlots;

    }

    validationBtnId: string;
    inputs: Record<string, InputModel>;
    DOMSlots: Record<string, ReactiveDomSlot> = {};
    validityObserver: Function;

    _realTimeValidation: boolean;
    _isValid = false;


    //! Order this mess

    get value(): Record<string, string | string[]> {
        return Object.entries(this.inputs).reduce((acc, [key, { value }]) => ({ ...acc, [key]: value }), {});
    }

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

    get isValid() {
        return this.isValid;
        this.validityObserver(this.isValid);
    }

    private set isValid(isValid) {
        this._isValid = isValid;

        // if (this.isValid) {
        //     if (this.validationBtn.disabled) this.validationBtn.removeAttribute('disbled');

        // } else {
        //     this.validationBtn.setAttribute('disabled', 'true');
        //     this.realTimeValidation = true;
        // }
    }

    createInput(key: string, placeholder: string, observers: InputModelObservers, validationRules?: Function[], value?: string, allowsMultipleErrors?: boolean): InputModel {
        const id = key + 'Input';
        return new InputModel(id, placeholder, observers, validationRules, value, allowsMultipleErrors);
    }

    udpateDOMSlot(value: string, key: string) {
        this.DOMSlots[key].value = value;
    }
}

//! Bad namming
export class ReactiveDomSlot { //* Will embody the Cards text slots 
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

export class ReactiveBtn {
    constructor(id: string, text: string, onCLick: Function, disabled?: boolean) {
        this.id = id;
        this.setText(text);
        this.setDisabledState(disabled);
        this.setOnClickCallback(onCLick);
    }
    id: string;
    text: string;
    onClick: Function;
    disabled = false;

    setDisabledState(disabled: boolean) {
        this.disabled = disabled;
    }

    setText(text) {
        this.text = text;
    }

    setOnClickCallback(callback: Function) {
        this.btn.removeEventListener('click', () => this.onClick); //! Seems braindead

        this.onClick = callback;
        this.btn.addEventListener('click', () => this.onClick);
    }

    get btn() {
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
            //! When Form will have the control over validation this pattern must be rethought   
            if (validationRules) this._validationRules = validationRules;
            this.value = value;
        } else {
            this._validationRules = validationRules;
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

// ---------------------------
// Validation Rules
// ---------------------------


const formInputValidationRules = {
    cardholderName: [required, cardholderNameFormat],
    cardNumber: [required, cardNumberFormat],
    expirationDateMonth: [required],
    expirationDateYear: [required],
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

// ---------------------------
// Utility
// ---------------------------

function createReactiveForm(key: string, useDOMSlot = false): ReactiveForm {
    return {
        key,
        useDOMSlot,
        placeholder: cardPlaceholder[key],
        validationRules: formInputValidationRules[key],
        allowsMultipleErrors: false,
    }
}

const cardPlaceholder = {
    cardNumber: '0000 0000 0000 0000',
    cardholderName: 'Jane Appleseed',
    expirationDateMonth: '00',
    expirationDateYear: '00',
    cvc: '000'
}

// ---------------------------
// Script
// ---------------------------

//! INSTALL WEBPACK YOU LAZY BOYY !

const DOMStates: { [key: string]: { init: Function, destroy: Function, data: any } } = { //* Put any structure that's upper than the Form in hierachy 
    form: {
        data: {
            form: {
                reactiveFormKeys: ['cardNumber', 'cardholderName', 'expirationDateMonth', 'expirationDateYear', 'cvc'],
                model: null,
            },
            onValidate() {
                if (form.isValid) {
                    //* Add API call & error handling here
                    this.destroy()
                };
            },
        },
        init() {
            this.data.form.model = new Form(
                this.data.form.data.reactiveFormKeys.map(key => createReactiveForm(key, true)),
                'validateBtn',
                this.data.form.realTimeValidation
            );
            //? Could be nice to add a render function using tsx or web components
            document.getElementsByTagName('form')[0].style.display = 'block';
        },
        destroy() {
            //? Could notify the destroy event
            document.getElementsByTagName('form')[0].style.display = 'none';
        }
    }
}

const context = {
    data: {
        _state: null,
        formValues: null,
    },

    get state() {
        return this.state;
    },

    set state(state) {
        this._state = state;
        switch (this.state) {
            case ('form'):
                this.components.form.onInit();
                break;
        }
    },

    validate() {
        if (Object.hasOwn(this.components[this.state], 'onValidate')) this.components[this.state].onValidate();
    },


    components: {
        form: {
            data: {
                form: {
                    reactiveFormKeys: ['cardNumber', 'cardholderName', 'expirationDateMonth', 'expirationDateYear', 'cvc'],
                    model: null,
                },
            },
            init() {
                this.data.form.model = new Form(
                    this.data.form.data.reactiveFormKeys.map(key => createReactiveForm(key, true)),
                    'validateBtn',
                    this.data.form.validation
                );
                //? Could be nice to add a render function using tsx or web components
                document.getElementsByTagName('form')[0].style.display = 'block';
            },
            onValidate() {
                if (this.form.model.isValid) {
                    //* Add API call & error handling here
                    this.destroy()
                } else if (!this.form.model.realTimeValidation) {
                    this.form.model.realTimeValidation = true;
                }
            },
            destroy() {
                //? I don't like that components handles their own display
                //? Should be a nice way to notify that destroy is triggered

                //- Maybe it's not too bad since those function instead of forming a real lifecyle looks a loot like VueJs events 
                document.getElementsByTagName('form')[0].style.display = 'none';
            }
        },
    },

    validationBtn: new ReactiveBtn('validateBtn', '', () => { }),

    setState(state) {
        this.state = state;

    }
}


const form = new Form(CREADIT_CARD_KEYS.map(key => createReactiveForm(key)), 'validateBtn');

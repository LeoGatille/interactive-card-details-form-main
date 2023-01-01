// ---------------------------
// Classes
// ---------------------------
export class Form {
    constructor(fields, validationBtnId, validityObserver, realTimeValidation = false) {
        this.realTimeValidation = realTimeValidation;
        this.validationBtnId = validationBtnId;
        this.validityObserver = validityObserver;
        const { inputs, DOMSlots } = fields
            .reduce((acc, { useDOMSlot, key, ...input }) => {
            const observers = {
                onValueChanges: useDOMSlot ? (value) => this.udpateDOMSlot(value, key) : () => { },
                onErrorsChanges: realTimeValidation ? (errors) => this.handleErrors(errors, key) : () => { },
            };
            //! Make it readable
            acc.inputs[key] = this.createInput(key, input.placeholder, observers, input.validationRules, input.value, input.allowsMultipleErrors);
            if (useDOMSlot)
                acc.DOMSlots[key] = new ReactiveDomSlot(key + 'Slot', input.value);
            return acc;
        }, { inputs: {}, DOMSlots: {} });
        this.inputs = inputs;
        this.DOMSlots = DOMSlots;
    }
    validationBtnId;
    inputs;
    DOMSlots = {};
    validityObserver;
    _realTimeValidation;
    _isValid = false;
    //! Order this mess
    get value() {
        return Object.entries(this.inputs).reduce((acc, [key, { value }]) => ({ ...acc, [key]: value }), {});
    }
    get realTimeValidation() {
        return this._realTimeValidation;
    }
    set realTimeValidation(activated) {
        this._realTimeValidation = activated;
        if (this._realTimeValidation)
            this.updateInputObservers('onErrorsChanges', this.udpateDOMSlot);
    }
    updateInputObservers(eventName, callback) {
        Object.entries(this.inputs).forEach(([key, input]) => input.updateObserver(eventName, (value) => callback(value, key)));
    }
    handleErrors(errors, key) {
        this.displayErrorMessages(errors, key + 'Error');
        if (errors.length) {
            this.isValid = this.areAllInputsValid();
        }
    }
    areAllInputsValid() {
        return Object.values(this.inputs).every(({ isValid }) => isValid);
    }
    displayErrorMessages(errors, id) {
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
    getErrorContainer(id) {
        return document.getElementById(id);
    }
    get validationBtn() {
        //? Could handle the enter key input
        return document.getElementById(this.validationBtnId);
    }
    get isValid() {
        return this.isValid;
        this.validityObserver(this.isValid);
    }
    set isValid(isValid) {
        this._isValid = isValid;
        // if (this.isValid) {
        //     if (this.validationBtn.disabled) this.validationBtn.removeAttribute('disbled');
        // } else {
        //     this.validationBtn.setAttribute('disabled', 'true');
        //     this.realTimeValidation = true;
        // }
    }
    createInput(key, placeholder, observers, validationRules, value, allowsMultipleErrors) {
        const id = key + 'Input';
        return new InputModel(id, placeholder, observers, validationRules, value, allowsMultipleErrors);
    }
    udpateDOMSlot(value, key) {
        this.DOMSlots[key].value = value;
    }
}
//! Bad namming
export class ReactiveDomSlot {
    constructor(id, value) {
        this.id = id;
        this._value = value;
    }
    id;
    _value;
    set value(v) {
        this._value = v;
        this.updateDOM();
    }
    updateDOM() {
        this.slot.innerText = this.value;
    }
    get slot() {
        return document.getElementById(this.id);
    }
}
export class ReactiveBtn {
    constructor(id, text, onCLick, disabled) {
        this.id = id;
        this.setText(text);
        this.setDisabledState(disabled);
        this.setOnClickCallback(onCLick);
    }
    id;
    text;
    onClick;
    disabled = false;
    setDisabledState(disabled) {
        this.disabled = disabled;
    }
    setText(text) {
        this.text = text;
    }
    setOnClickCallback(callback) {
        this.btn.removeEventListener('click', () => this.onClick); //! Seems braindead
        this.onClick = callback;
        this.btn.addEventListener('click', () => this.onClick);
    }
    get btn() {
        return document.getElementById(this.id);
    }
}
export class InputModel {
    constructor(id, placeholder, observers, validationRules, value, allowsMultipleErrors) {
        this.id = id;
        this.placeholder = placeholder;
        this.observers = observers;
        this.allowsMultipleErrors = allowsMultipleErrors;
        if (value) {
            //! When Form will have the control over validation this pattern must be rethought   
            if (validationRules)
                this._validationRules = validationRules;
            this.value = value;
        }
        else {
            this._validationRules = validationRules;
        }
        this.setDOMEventListener();
    }
    id;
    placeholder;
    errors = [];
    observers = null;
    allowsMultipleErrors = false;
    _validationRules = [];
    _value = '';
    // Utility 
    updateObserver(key, callback) {
        this.observers[key] = callback;
    }
    // Value
    set value(v) {
        this._value = v;
        this.observers.onValueChanges(this.value || this.placeholder);
        if (this.validationRules.length)
            this.validate(); //! Maybe give the validation triggering to the Form
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
    set validationRules(rules) {
        this._validationRules = rules;
        this.validate;
    }
    get isValid() {
        return !this.errors.length;
    }
    // DOM
    setDOMEventListener() {
        this.input.addEventListener('input', (event) => this.value = event.target.value);
    }
    get input() {
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
function required(v) {
    return !!v || 'Can\'t be blank';
}
function regExpCheck(v, regExp) {
    return !!v.match(regExp);
}
function cardholderNameFormat(v) {
    return regExpCheck(v, cardholderName) || 'Wrong format';
}
function cardNumberFormat(v) {
    return regExpCheck(v, cardNumber) || 'Wrong format';
}
// ---------------------------
// Utility
// ---------------------------
function createReactiveForm(key, useDOMSlot = false) {
    return {
        key,
        useDOMSlot,
        placeholder: cardPlaceholder[key],
        validationRules: formInputValidationRules[key],
        allowsMultipleErrors: false,
    };
}
const cardPlaceholder = {
    cardNumber: '0000 0000 0000 0000',
    cardholderName: 'Jane Appleseed',
    expirationDateMonth: '00',
    expirationDateYear: '00',
    cvc: '000'
};
// ---------------------------
// Script
// ---------------------------
//! INSTALL WEBPACK YOU LAZY BOYY !
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
        switch (this.state) { //! this.tate shouldn't only be a component key
            case ('form'): //? Not very flexible
                this.components.form.onInit();
                break;
        }
    },
    init() {
        this.state = 'form';
    },
    validate() {
        switch (this.state) {
            case ('form'): //? Not very flexible
                const isValid = this.components.form.onValidate();
                if (isValid) { //! Getting messy
                    this.data.formValue = this.components.form.value;
                    this.commited.form.destroy();
                }
                break;
        }
    },
    components: {
        form: {
            props: {
                reactiveFormKeys: ['cardNumber', 'cardholderName', 'expirationDateMonth', 'expirationDateYear', 'cvc'],
            },
            data: {
                model: null,
            },
            init() {
                this.data.form.model = new Form(this.props.reactiveFormKeys.map(key => createReactiveForm(key, true)), 'validateBtn', this.data.form.validation);
                //? Could be nice to add a render function using tsx or web components
                document.getElementsByTagName('form')[0].style.display = 'block';
            },
            onValidate() {
                //! This is just bad
                if (this.form.model.isValid)
                    return true;
                //! Bad sideEffect. Should be higher
                //? realTimeValidation could become a prop
                if (!this.form.model.realTimeValidation)
                    this.form.model.realTimeValidation = true;
                return false;
            },
            destroy() {
                //? I don't like that components handles their own display
                //? Should be a nice way to notify that destroy is triggered
                document.getElementsByTagName('form')[0].style.display = 'none';
            }
        },
    },
    validationBtn: new ReactiveBtn('validateBtn', '', () => { }),
    setState(state) {
        this.state = state;
    }
};
//# sourceMappingURL=index.js.map
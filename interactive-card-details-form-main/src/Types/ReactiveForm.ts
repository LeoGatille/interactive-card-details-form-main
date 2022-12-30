import { InputModel, DomController } from './../index';
export type ReactiveForm = {
    key: string;
    placeholder: string;
    validationRules?: Function[];
    useDOMSlot?: boolean;
    allowsMultipleErrors?: boolean;
    value?: string;
}
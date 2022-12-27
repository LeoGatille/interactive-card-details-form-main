import { InputKey } from './InputKey';
export type Model = {
    key: InputKey,
    id: string,
    value: string,
    validationRules: Function[],
    onUpdate: Function,
    placeholder: string,
}
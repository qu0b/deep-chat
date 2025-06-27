import {KEYBOARD_KEY} from '../../../../utils/buttons/keyboardKeys';
import {FileAttachments} from '../fileAttachments/fileAttachments';
import {StyleUtils} from '../../../../utils/element/styleUtils';
import {Browser} from '../../../../utils/browser/browser';
import {ServiceIO} from '../../../../services/serviceIO';
import {TextInput} from '../../../../types/textInput';
import {CustomStyle} from '../../../../types/styles';
import {TextInputEvents} from './textInputEvents';
import {DeepChat} from '../../../../deepChat';
import {PasteUtils} from './pasteUtils';
import {FocusUtils} from './focusUtils';

// TO-DO state for focused (like input)
export class TextInputEl {
  public static TEXT_INPUT_ID = 'text-input';
  readonly elementRef: HTMLElement;
  readonly inputElementRef: HTMLElement;
  // readonly hiddenInputRef: HTMLInputElement;
  private readonly _config: TextInput;
  submit?: () => void;

  constructor(deepChat: DeepChat, serviceIO: ServiceIO, fileAts: FileAttachments) {
    const processedConfig = TextInputEl.processConfig(serviceIO, deepChat.textInput);
    this.elementRef = TextInputEl.createContainerElement(processedConfig?.styles?.container);
    this._config = processedConfig;
    // this.hiddenInputRef = this.createHiddenInput();
    this.inputElementRef = this.createInputElement();
    this.elementRef.appendChild(this.inputElementRef);
    deepChat.setPlaceholderText = this.setPlaceholderText.bind(this);
    deepChat.setPlaceholderText(this._config.placeholder?.text || 'Ask me anything!');
    // Initialize visual viewport listener if the browser supports it
  }

  private static processConfig(serviceIO: ServiceIO, textInput?: TextInput) {
    textInput ??= {};
    textInput.disabled ??= serviceIO.isTextInputDisabled;
    textInput.placeholder ??= {};
    textInput.placeholder.text ??= serviceIO.textInputPlaceholderText;
    return textInput;
  }

  private static createContainerElement(containerStyle?: CustomStyle) {
    const contentContainerElement = document.createElement('div');
    contentContainerElement.id = 'text-input-container';
    Object.assign(contentContainerElement.style, containerStyle);
    return contentContainerElement;
  }

  // this is is a bug fix where if the browser is scrolled down and the user types in text that creates new line
  // the browser scrollbar will move up which leads to undesirable UX.
  // More details in this Stack Overflow question:
  // https://stackoverflow.com/questions/76285135/prevent-automatic-scroll-when-text-is-inserted-into-contenteditable-div
  // prettier-ignore
  private static preventAutomaticScrollUpOnNewLine(inputElement: HTMLDivElement) {
    let scrollY: number | undefined;
    inputElement.addEventListener('keydown', () => {scrollY = window.scrollY;});
    inputElement.addEventListener('input', () => { if (scrollY !== window.scrollY) window.scrollTo({top: scrollY});});
  }

  private createHiddenInput() {
    const hiddenInput = document.createElement('input');
    hiddenInput.id = 'hidden-text-input';
    hiddenInput.style.display = 'none';
    hiddenInput.style.width = '0';
    hiddenInput.style.height = '0';
    return hiddenInput;
  }

  // this also similarly prevents scroll up
  public clear() {
    // const scrollY = window.scrollY;
    if (!this.inputElementRef.classList.contains('text-input-disabled')) {
      Object.assign(this.inputElementRef.style, this._config.placeholder?.style);
      this.inputElementRef.textContent = '';
      // FocusUtils.focusEndOfInput(this.inputElementRef);
    }
    // if (Browser.IS_CHROMIUM) window.scrollTo({top: scrollY});
  }

  private createInputElement() {
    const inputElement = document.createElement('div');

    // inputElement.appendChild(this.hiddenInputRef);
    inputElement.id = TextInputEl.TEXT_INPUT_ID;
    inputElement.classList.add('text-input-styling');
    inputElement.inputMode = 'text';

    // Make the browser treat this div like an input element
    inputElement.setAttribute('role', 'textbox');
    inputElement.setAttribute('aria-multiline', 'true');
    inputElement.setAttribute('aria-label', 'Message input');
    inputElement.setAttribute('tabindex', '0');

    if (Browser.IS_CHROMIUM) TextInputEl.preventAutomaticScrollUpOnNewLine(inputElement);
    if (typeof this._config.disabled === 'boolean' && this._config.disabled === true) {
      inputElement.contentEditable = 'false';
      inputElement.classList.add('text-input-disabled');
      inputElement.setAttribute('aria-disabled', 'true');
    } else {
      inputElement.contentEditable = 'true';
      inputElement.setAttribute('aria-disabled', 'false');
      this.addEventListeners(inputElement);
    }
    Object.assign(inputElement.style, this._config.styles?.text);
    Object.assign(inputElement.style, this._config.placeholder?.style);
    if (!this._config.placeholder?.style?.color) inputElement.setAttribute('textcolor', '');
    return inputElement;
  }

  public removePlaceholderStyle() {
    if (!this.inputElementRef.classList.contains('text-input-disabled') && this._config.placeholder?.style) {
      StyleUtils.unsetStyle(this.inputElementRef, this._config.placeholder?.style);
      Object.assign(this.inputElementRef.style, this._config?.styles?.text);
    }
  }

  private addEventListeners(inputElement: HTMLElement) {
    if (this._config.styles?.focus) {
      inputElement.onfocus = () => {
        Object.assign(this.elementRef.style, this._config.styles?.focus);
      };
      inputElement.onblur = this.onBlur.bind(this, this._config.styles.focus, this._config.styles?.container);
    }
    inputElement.addEventListener('keydown', this.onKeydown.bind(this));
    inputElement.addEventListener('input', this.onInput.bind(this));
    inputElement.addEventListener('paste', PasteUtils.sanitizePastedTextContent);
  }

  private onBlur(focusStyle: CustomStyle, containerStyle?: CustomStyle) {
    StyleUtils.unsetStyle(this.elementRef, focusStyle);
    if (containerStyle) Object.assign(this.elementRef.style, containerStyle);
  }

  public blur() {
    console.dir(this.inputElementRef);
    this.inputElementRef.blur();
  }

  private onKeydown(event: KeyboardEvent) {
    if (event.key === KEYBOARD_KEY.ENTER && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      this.submit?.();
      this.inputElementRef.blur();
    }
  }

  private onInput() {
    if (!this.isTextInputEmpty()) {
      this.removePlaceholderStyle();
    } else {
      Object.assign(this.inputElementRef.style, this._config.placeholder?.style);
    }
  }

  private setPlaceholderText(text: string) {
    // this.inputElementRef.setAttribute('deep-chat-placeholder-text', text);
  }

  public isTextInputEmpty() {
    return this.inputElementRef.textContent === '';
  }
}

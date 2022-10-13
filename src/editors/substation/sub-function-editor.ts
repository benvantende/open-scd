import {
  html,
  LitElement,
  TemplateResult,
  property,
  customElement,
  state,
  css,
  query,
} from 'lit-element';
import { translate } from 'lit-translate';

import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-menu';
import { IconButton } from '@material/mwc-icon-button';
import { ListItem } from '@material/mwc-list/mwc-list-item';
import { Menu } from '@material/mwc-menu';

import '../../action-pane.js';
import './sub-function-editor.js';
import './general-equipment-editor.js';
import {
  getChildElementsByTagName,
  newActionEvent,
  newWizardEvent,
  SCLTag,
  tags,
} from '../../foundation.js';
import { emptyWizard, wizards } from '../../wizards/wizard-library.js';
import { classMap } from 'lit-html/directives/class-map.js';

function childTags(element: Element | null | undefined): SCLTag[] {
  if (!element) return [];

  return tags[<SCLTag>element.tagName].children.filter(
    child => wizards[child].create !== emptyWizard
  );
}

/** Pane rendering `SubFunction` element with its children */
@customElement('sub-function-editor')
export class SubFunctionEditor extends LitElement {
  /** The document being edited as provided to editor by [[`Zeroline`]]. */
  @property({ attribute: false })
  doc!: XMLDocument;
  /** The edited `SubFunction` element */
  @property({ attribute: false })
  element!: Element;

  @property({ type: Boolean })
  showfunctions = false  

  @state()
  private get header(): string {
    const name = this.element.getAttribute('name');
    const desc = this.element.getAttribute('desc');
    const type = this.element.getAttribute('type');

    return `${name}${desc ? ` - ${desc}` : ''}${type ? ` (${type})` : ''}`;
  }

  @query('mwc-menu') addMenu!: Menu;
  @query('mwc-icon-button[icon="playlist_add"]') addButton!: IconButton;

  private openEditWizard(): void {
    const wizard = wizards['SubFunction'].edit(this.element);
    if (wizard) this.dispatchEvent(newWizardEvent(wizard));
  }

  remove(): void {
    if (this.element.parentElement)
      this.dispatchEvent(
        newActionEvent({
          old: {
            parent: this.element.parentElement,
            element: this.element,
          },
        })
      );
  }

  private openCreateWizard(tagName: string): void {
    const wizard = wizards[<SCLTag>tagName].create(this.element!);

    if (wizard) this.dispatchEvent(newWizardEvent(wizard));
  }

  firstUpdated(): void {
    this.addMenu.anchor = <HTMLElement>this.addButton;
  }

  private renderLNodes(): TemplateResult {
    const lNodes = getChildElementsByTagName(this.element, 'LNode');

    return lNodes.length
      ? html`<div class="container lnode">
          ${lNodes.map(
            lNode =>
              html`<l-node-editor
                .doc=${this.doc}
                .element=${lNode}
              ></l-node-editor>`
          )}
        </div>`
      : html``;
  }

  private renderGeneralEquipment(): TemplateResult {
    const generalEquipment = getChildElementsByTagName(this.element, 'GeneralEquipment');

    return html`
    <div class="${classMap({
      content: true,
      actionicon: !this.showfunctions,
    })}" >
    ${generalEquipment.map(
      gEquipment =>
        html`<general-equipment-editor
      .doc=${this.doc}
      .element=${gEquipment}
      ?showfunctions=${this.showfunctions}
      ></general-equipment-editor>`)}</div>`;
  }

  private renderSubFunctions(): TemplateResult {
    const subfunctions = getChildElementsByTagName(this.element, 'SubFunction');
    return html` ${subfunctions.map(
      subFunction =>
        html`<sub-function-editor
          .doc=${this.doc}
          .element=${subFunction}
        ></sub-function-editor>`
    )}`;
  }

  private renderAddButtons(): TemplateResult[] {
    return childTags(this.element).map(
      child =>
        html`<mwc-list-item value="${child}"
          ><span>${child}</span></mwc-list-item
        >`
    );
  }

  render(): TemplateResult {
    return html`<action-pane label="${this.header}" icon="functions" secondary
      ><abbr slot="action" title="${translate('edit')}">
        <mwc-icon-button
          icon="edit"
          @click=${() => this.openEditWizard()}
        ></mwc-icon-button> </abbr
      ><abbr slot="action" title="${translate('remove')}">
        <mwc-icon-button
          icon="delete"
          @click=${() => this.remove()}
        ></mwc-icon-button> </abbr
      ><abbr
        slot="action"
        style="position:relative;"
        title="${translate('add')}"
      >
        <mwc-icon-button
          icon="playlist_add"
          @click=${() => (this.addMenu.open = true)}
        ></mwc-icon-button
        ><mwc-menu
          corner="BOTTOM_RIGHT"
          menuCorner="END"
          @action=${(e: Event) => {
            const tagName = (<ListItem>(<Menu>e.target).selected).value;
            this.openCreateWizard(tagName);
          }}
          >${this.renderAddButtons()}</mwc-menu
        > </abbr>
        ${this.renderGeneralEquipment()}
      ${this.renderLNodes()}${this.renderSubFunctions()}</action-pane
    >`;
  }

  static styles = css`
    abbr {
      text-decoration: none;
      border-bottom: none;
    }

    .container.lnode {
      display: grid;
      grid-gap: 12px;
      padding: 8px 12px 16px;
      box-sizing: border-box;
      grid-template-columns: repeat(auto-fit, minmax(64px, auto));
    }
  `;
}

import { fixture, expect } from '@open-wc/testing';

import Communication from '../../../../src/editors/Communication.js';
import { Editing } from '../../../../src/Editing.js';
import { Wizarding, WizardingElement } from '../../../../src/Wizarding.js';
import { html } from '../../../../src/foundation.js';

describe('Communication Plugin', () => {
  customElements.define(
    'communication-plugin',
    Wizarding(Editing(Communication))
  );
  let element: Communication;
  beforeEach(async () => {
    element = await fixture(
      html`<communication-plugin></communication-plugin>`
    );
  });

  describe('without a doc loaded', () => {
    it('looks like the latest snapshot', () => {
      expect(element).shadowDom.to.equalSnapshot();
    });
  });

  describe('with a doc loaded including communication section', () => {
    let doc: XMLDocument;
    let element: Communication;
    beforeEach(async () => {
      doc = await fetch('/base/test/testfiles/valid2007B4.scd')
        .then(response => response.text())
        .then(str => new DOMParser().parseFromString(str, 'application/xml'));
      element = await fixture(
        html`<communication-plugin .doc="${doc}"></communication-plugin>`
      );
    });
    it('constains a subnetwork-editor rendering the communication section', () => {
      expect(element.shadowRoot?.querySelector('subnetwork-editor')).to.exist;
    });
  });

  describe('with a doc loaded missing a communication section', () => {
    let doc: XMLDocument;
    let parent: WizardingElement;
    let fab: HTMLElement;

    beforeEach(async () => {
      doc = await fetch('/base/test/testfiles/missingCommunication.scd')
        .then(response => response.text())
        .then(str => new DOMParser().parseFromString(str, 'application/xml'));
      parent = <WizardingElement>(
        await fixture(
          html`<mock-wizard
            ><communication-plugin .doc=${doc}></communication-plugin
          ></mock-wizard>`
        )
      );
      await element.updateComplete;
      fab = <HTMLElement>(
        parent
          ?.querySelector('communication-plugin')
          ?.shadowRoot?.querySelector('mwc-fab')
      );
    });
    it('has a mwc-fab', () => {
      expect(element.shadowRoot?.querySelector('mwc-fab')).to.exist;
    });
    it('that opens a add subnetwork wizard on mwc-fab click', async () => {
      expect(parent.wizardUI.dialogs.length).to.equal(0);
      fab.click();
      await parent.updateComplete;
      expect(parent.wizardUI.dialogs.length).to.equal(1);
    });
  });
});

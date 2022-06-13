import { expect, fixture, html } from '@open-wc/testing';
import { SinonSpy, spy } from 'sinon';

import '../../../../mock-wizard.js';

import { Delete, EditorAction, isDelete, isReplace, Replace, WizardInputElement } from '../../../../../src/foundation.js';
import { MockWizard } from '../../../../mock-wizard.js';
import { WizardTextField } from '../../../../../src/wizard-textfield.js';
import { editLogicLinkWizard } from '../../../../../src/editors/protocol104/wizards/logiclink.js';

describe('Wizards for the Logic Link SCL element group', () => {
  let doc: XMLDocument;
  let element: MockWizard;
  let inputs: WizardInputElement[];
  let input: WizardInputElement | undefined;
  let primaryAction: HTMLElement;

  let actionEvent: SinonSpy;

  beforeEach(async () => {
    doc = await fetch('/test/testfiles/104/valid-subnetwork.scd')
      .then(response => response.text())
      .then(str => new DOMParser().parseFromString(str, 'application/xml'));

    element = <MockWizard>await fixture(html`<mock-wizard></mock-wizard>`);

    actionEvent = spy();
    window.addEventListener('editor-action', actionEvent);
  });

  describe('include an edit wizard that', () => {
    beforeEach(async () => {
      const wizard = editLogicLinkWizard(doc.querySelector('Communication > SubNetwork[name="W1"] > ConnectedAP[iedName="B1"]')!, 2, 1);
      element.workflow.push(() => wizard);
      await element.requestUpdate();
  
      inputs = Array.from(element.wizardUI.inputs);
  
      primaryAction = <HTMLElement>(
        element.wizardUI.dialog?.querySelector(
          'mwc-button[slot="primaryAction"]'
        )
      );
    });

    it('does not edit any P element with unchanged wizard inputs', async () => {
      primaryAction.click();
      await element.requestUpdate();
      expect(actionEvent).to.not.have.been.called;
    });

    it('does not trigger a complex editor action to update P elements(s) when not all fields are filled in', async () => {
      input = <WizardTextField>inputs.find(input => input.label === 'IP-SUBNET');
      input.value = '';
      await input.requestUpdate();

      primaryAction.click();
      await element.requestUpdate();

      expect(actionEvent).to.not.have.been.called;
    });

    it('properly updates a P element of type IP', async () => {
      input = <WizardTextField>inputs.find(input => input.label === 'IP');
      input.value = '192.128.0.12';
      await input.requestUpdate();

      primaryAction.click();
      await element.requestUpdate();

      const action = <EditorAction>actionEvent.args[0][0].detail.action;
      expect(action).to.satisfy(isReplace);
      expect((<Replace>action).old.element.innerHTML).to.eql('192.128.0.2');
      expect((<Replace>action).new.element.innerHTML).to.eql('192.128.0.12');
    });

    it('properly deletes a full logic link group', async () => {
      const deleteAction = <HTMLElement>(
        element.wizardUI.dialog?.querySelector(
          'mwc-menu > mwc-list-item'
        )
      );

      deleteAction.click();
      await element.requestUpdate();

      const firstAction = <EditorAction>actionEvent.args[0][0].detail.action;
      expect(firstAction).to.satisfy(isDelete);
      expect((<Delete>firstAction).old.element.textContent).to.eql('192.128.0.2');
      const secondAction = <EditorAction>actionEvent.args[1][0].detail.action;
      expect(secondAction).to.satisfy(isDelete);
      expect((<Delete>secondAction).old.element.textContent).to.eql('255.255.255.0');
    });
  });
});

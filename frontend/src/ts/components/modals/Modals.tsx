import { JSXElement } from "solid-js";

import { CommandlineModal } from "./CommandlineModal";
import { ContactModal } from "./ContactModal";
import { CustomTestDurationModal } from "./CustomTestDurationModal";
import { CustomTextModal } from "./CustomTextModal";
import { CustomWordAmountModal } from "./CustomWordAmountModal";
import { MobileTestConfigModal } from "./MobileTestConfigModal";
import { PbTablesModal } from "./PbTablesModal";
import { PractiseWordsModal } from "./PractiseWordsModal";
import { QuoteSearchModal } from "./QuoteSearchModal";
import { ShareTestSettings } from "./ShareTestSettings";
import { SimpleModal } from "./SimpleModal";
import { SupportModal } from "./SupportModal";
import { TheRestModal } from "./TheRestModal";
import { VersionHistoryModal } from "./VersionHistoryModal";

export function Modals(): JSXElement {
  return (
    <>
      <CommandlineModal />
      <VersionHistoryModal />
      <ContactModal />
      <SupportModal />
      <SimpleModal />
      <CustomTextModal />
      <QuoteSearchModal />
      <CustomTestDurationModal />
      <CustomWordAmountModal />
      <PbTablesModal />
      <PractiseWordsModal />
      <ShareTestSettings />
      <MobileTestConfigModal />
      <TheRestModal />
    </>
  );
}

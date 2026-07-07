// DMN-1.5-Fixture: eine Rabattermittlung mit InputData, Information Requirement,
// Entscheidungstabelle und vollständigem DMNDI. Dient Round-Trip-Test (INV-M4)
// und der Renderer-E2E.
export const rabattDmn = `<?xml version="1.0" encoding="UTF-8"?>
<dmn:definitions xmlns:dmn="https://www.omg.org/spec/DMN/20240513/MODEL/" xmlns:dmndi="https://www.omg.org/spec/DMN/20240513/DMNDI/" xmlns:dc="https://www.omg.org/spec/DMN/20180521/DC/" xmlns:di="https://www.omg.org/spec/DMN/20180521/DI/" id="defs_rabatt" name="Rabattermittlung" namespace="http://hestia/dmn/rabatt">
  <dmn:inputData id="input_umsatz" name="Jahresumsatz" />
  <dmn:decision id="decision_rabatt" name="Rabatt ermitteln">
    <dmn:informationRequirement id="ir_1">
      <dmn:requiredInput href="#input_umsatz" />
    </dmn:informationRequirement>
    <dmn:decisionTable id="dt_rabatt" hitPolicy="UNIQUE">
      <dmn:input id="in_1">
        <dmn:inputExpression id="ie_1" typeRef="number">
          <dmn:text>umsatz</dmn:text>
        </dmn:inputExpression>
      </dmn:input>
      <dmn:output id="out_1" name="rabatt" typeRef="number" />
      <dmn:rule id="rule_1">
        <dmn:inputEntry id="ue_1"><dmn:text>&lt; 10000</dmn:text></dmn:inputEntry>
        <dmn:outputEntry id="oe_1"><dmn:text>0.0</dmn:text></dmn:outputEntry>
      </dmn:rule>
      <dmn:rule id="rule_2">
        <dmn:inputEntry id="ue_2"><dmn:text>&gt;= 10000</dmn:text></dmn:inputEntry>
        <dmn:outputEntry id="oe_2"><dmn:text>0.1</dmn:text></dmn:outputEntry>
      </dmn:rule>
    </dmn:decisionTable>
  </dmn:decision>
  <dmndi:DMNDI>
    <dmndi:DMNDiagram id="diagram_1">
      <dmndi:DMNShape id="shape_input" dmnElementRef="input_umsatz">
        <dc:Bounds x="160" y="100" width="180" height="60" />
      </dmndi:DMNShape>
      <dmndi:DMNShape id="shape_decision" dmnElementRef="decision_rabatt">
        <dc:Bounds x="160" y="240" width="180" height="80" />
      </dmndi:DMNShape>
      <dmndi:DMNEdge id="edge_ir" dmnElementRef="ir_1">
        <di:waypoint x="250" y="160" />
        <di:waypoint x="250" y="240" />
      </dmndi:DMNEdge>
    </dmndi:DMNDiagram>
  </dmndi:DMNDI>
</dmn:definitions>`;

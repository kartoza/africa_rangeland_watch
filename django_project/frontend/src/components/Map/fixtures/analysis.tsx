import { SelectOption } from "../DataTypes";

/**
 * Analysis fixture
 */
export const Types = {
  BASELINE: 'Baseline',
  TEMPORAL: 'Temporal',
  SPATIAL: 'Spatial',
}
export const TemporalResolution = {
  ANNUAL: 'Annual',
  QUARTERLY: 'Quarterly'
}
export const Landscapes: SelectOption[] = [
  {
    label: "Limpopo NP",
    value: "Limpopo NP"
  },
  {
    label: "UCPP",
    value: "UCPP"
  },
  {
    label: "Ngamiland",
    value: "Ngamiland"
  },
  {
    label: "Soutpansberg",
    value: "Soutpansberg"
  },
  {
    label: "K2C",
    value: "K2C"
  },
  {
    label: "Mapungubwe TFCA",
    value: "Mapungubwe TFCA"
  },
  {
    label: "Namakwa",
    value: "Namakwa"
  },
  {
    label: "Drakensberg Sub-Escarpment",
    value: "Drakensberg Sub-Escarpment"
  },
  {
    label: "Bahine NP",
    value: "Bahine NP"
  },
  {
    label: "Zambia",
    value: "Zambia"
  }
]
import { BD_DISTRICTS, BD_LOCATIONS, POST_OFFICES } from './bd-post-office-master'
import bnMaster from './bd-post-office-master-bn.json'

export type LocalizedOption = {
  value: string
  label: string
}

const DISTRICT_BN = (bnMaster.districtBn || {}) as Record<string, string>
const UPAZILLA_BN = (bnMaster.upazillaBn || {}) as Record<string, string>
const POST_OFFICE_BN = (bnMaster.postOfficeBn || {}) as Record<string, string>

const DIGIT_BN: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯'
}

function normalizeKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toBanglaDigits(input: string): string {
  return String(input || '').replace(/[0-9]/g, (d) => DIGIT_BN[d] || d)
}

function lookupBangla(map: Record<string, string>, value: string): string {
  return map[normalizeKey(value)] || value
}

export function localizeDistrictName(value: string, isBangla: boolean): string {
  if (!isBangla) return value
  return lookupBangla(DISTRICT_BN, value)
}

export function localizeUpazillaName(value: string, isBangla: boolean): string {
  if (!isBangla) return value
  return lookupBangla(UPAZILLA_BN, value)
}

export function localizePostOfficeLabel(name: string, code: string, isBangla: boolean): string {
  if (!isBangla) return `${name} (${code})`
  return `${lookupBangla(POST_OFFICE_BN, name)} (${toBanglaDigits(code)})`
}

export const BD_DISTRICTS_BN: LocalizedOption[] = BD_DISTRICTS.map((district) => ({
  value: district,
  label: localizeDistrictName(district, true)
}))

export const BD_LOCATIONS_BN: Record<string, LocalizedOption[]> = Object.fromEntries(
  Object.entries(BD_LOCATIONS).map(([district, upazillas]) => [
    district,
    upazillas.map((upazilla) => ({ value: upazilla, label: localizeUpazillaName(upazilla, true) }))
  ])
) as Record<string, LocalizedOption[]>

export const POST_OFFICES_BN: Record<string, LocalizedOption[]> = Object.fromEntries(
  Object.entries(POST_OFFICES).map(([upazilla, offices]) => [
    upazilla,
    offices.map((office) => ({
      value: `${office.name} (${office.code})`,
      label: localizePostOfficeLabel(office.name, office.code, true)
    }))
  ])
) as Record<string, LocalizedOption[]>

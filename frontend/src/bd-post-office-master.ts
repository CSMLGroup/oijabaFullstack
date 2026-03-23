import master from './bd-post-office-master.json'

export type PostOfficeOption = {
  name: string
  code: string
}

export const POST_OFFICE_MASTER = master

export const BD_DISTRICTS = master.districts as string[]

export const BD_LOCATIONS = master.districtToUpazillas as Record<string, string[]>

export const LOCATION_TREE = master.districtUpazillaPostOffices as Record<string, Record<string, PostOfficeOption[]>>

export const POST_OFFICES = master.upazillaToPostOffices as Record<string, PostOfficeOption[]>

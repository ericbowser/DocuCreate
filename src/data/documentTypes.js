export const DOC_TYPES = [
  {
    id:                  'room',
    label:               'Room Rental',
    desc:                'Single room in a shared property',
    leaseTitle:          'ROOM RENTAL LEASE AGREEMENT',
    propertyLabel:       'Room Description',
    propertyPlaceholder: 'e.g. Upstairs bedroom with private bath',
    tenantLabel:         'Tenant',
    showSharedAreas:     true,
    showPets:            true,
    isCommercial:        false,
    legalSubtype:        'Residential',
  },
  {
    id:                  'apartment',
    label:               'Apartment',
    desc:                'Full apartment or multi-unit dwelling',
    leaseTitle:          'RESIDENTIAL APARTMENT LEASE AGREEMENT',
    propertyLabel:       'Unit Description',
    propertyPlaceholder: 'e.g. Unit 4B, 2BR/1BA on the 3rd floor',
    tenantLabel:         'Tenant',
    showSharedAreas:     false,
    showPets:            true,
    isCommercial:        false,
    legalSubtype:        'Residential',
  },
  {
    id:                  'house',
    label:               'House',
    desc:                 'Single family or multi-family home',
    leaseTitle:          'RESIDENTIAL RENTAL AGREEMENT',
    propertyLabel:       'Property Description',
    propertyPlaceholder: 'e.g. 3BR/2BA single family home with attached garage',
    tenantLabel:         'Tenant',
    showSharedAreas:     false,
    showPets:            true,
    isCommercial:        false,
    legalSubtype:        'Residential',
  },
  {
    id:                  'condo',
    label:               'Condo / Townhouse',
    desc:                'Condominium or townhouse unit',
    leaseTitle:          'CONDOMINIUM RENTAL AGREEMENT',
    propertyLabel:       'Unit / Suite Description',
    propertyPlaceholder: 'e.g. Unit 12A, 2BR condo on 5th floor, HOA community',
    tenantLabel:         'Tenant',
    showSharedAreas:     false,
    showPets:            true,
    isCommercial:        false,
    legalSubtype:        'Residential',
  },
  {
    id:                  'commercial',
    label:               'Commercial',
    desc:                'Office, retail, or business space',
    leaseTitle:          'COMMERCIAL LEASE AGREEMENT',
    propertyLabel:       'Space Description',
    propertyPlaceholder: 'e.g. Suite 200, 1,500 sq ft open-plan office',
    tenantLabel:         'Tenant / Business',
    showSharedAreas:     false,
    showPets:            false,
    isCommercial:        true,
    legalSubtype:        'Commercial',
  },
]

export const DOC_TYPE_MAP = Object.fromEntries(DOC_TYPES.map(t => [t.id, t]))

// Returns the type config or a safe default
export function getDocType(id) {
  return DOC_TYPE_MAP[id] ?? DOC_TYPES[0]
}

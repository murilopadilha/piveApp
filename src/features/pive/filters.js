export const PIVE_FILTER_CATALOG_MODES = {
    STATUS: 'status',
    ANIMAL: 'animal',
}

const PIVE_STATUS_FILTER_OPTIONS = [
    { key: 'ALL', value: 'Todas as FIVs' },
    { key: 'IN_PROCESS', value: 'Em processo' },
    { key: 'OOCYTE_COLLECTION_COMPLETED', value: 'Coleta de oócitos completa' },
    { key: 'COMPLETED', value: 'FIV completa' },
]

const PIVE_ANIMAL_FILTER_OPTIONS = [
    { key: 'donor', value: 'Doadoras' },
    { key: 'bull', value: 'Touros' },
]

export const getPivePrimaryFilterOptions = (filterCatalogMode) => (
    filterCatalogMode === PIVE_FILTER_CATALOG_MODES.ANIMAL
        ? PIVE_ANIMAL_FILTER_OPTIONS
        : PIVE_STATUS_FILTER_OPTIONS
)

export const getPiveFilterToggleIcon = (filterCatalogMode) => (
    filterCatalogMode === PIVE_FILTER_CATALOG_MODES.ANIMAL
        ? 'cow'
        : 'list-status'
)

export const getPiveSecondaryCategory = (activeFilter) => (
    activeFilter === 'donor' || activeFilter === 'bull'
        ? activeFilter
        : null
)

export const getPiveSecondaryPlaceholder = (secondaryCategory) => {
    if (secondaryCategory === 'donor') return 'Selecione uma doadora'
    if (secondaryCategory === 'bull') return 'Selecione um touro'
    return 'Selecione uma opção'
}

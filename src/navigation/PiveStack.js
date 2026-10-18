import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import { useEffectiveContextQuery } from '../features/auth/hooks/useIdentityQueries'
import {
    CORRECTION_PERMISSIONS,
    hasCorrectionPermission,
} from '../features/corrections/correctionPermissions'
import { CORRECTION_ROUTES } from '../features/corrections/routes'
import CorrectionDetail from '../features/corrections/screens/CorrectionDetail'
import CorrectionList from '../features/corrections/screens/CorrectionList'
import { canReadDataQuality } from '../features/dataQuality/dataQualityPermissions'
import { DATA_QUALITY_ROUTES } from '../features/dataQuality/routes'
import DataQualityList from '../features/dataQuality/screens/DataQualityList'
import {
    DISTRIBUTION_PERMISSIONS,
    hasDistributionPermission,
} from '../features/distribution/distributionPermissions'
import { DISTRIBUTION_ROUTES } from '../features/distribution/routes'
import RecallDetail from '../features/distribution/screens/RecallDetail'
import RecallList from '../features/distribution/screens/RecallList'
import ShipmentDetail from '../features/distribution/screens/ShipmentDetail'
import ShipmentList from '../features/distribution/screens/ShipmentList'
import {
    DOCUMENT_PERMISSIONS,
    hasDocumentPermission,
} from '../features/documents/documentPermissions'
import { DOCUMENT_ROUTES } from '../features/documents/routes'
import DocumentDetail from '../features/documents/screens/DocumentDetail'
import DocumentList from '../features/documents/screens/DocumentList'
import { EMBRYO_ROUTES } from '../features/embryology/routes'
import EmbryoBatchIdentify from '../features/embryology/screens/EmbryoBatchIdentify'
import EmbryoDetail from '../features/embryology/screens/EmbryoDetail'
import EmbryoList from '../features/embryology/screens/EmbryoList'
import EmbryoTraceability from '../features/embryology/screens/EmbryoTraceability'
import { MATING_ROUTES } from '../features/fertilization/routes'
import MatingBatchCreate from '../features/fertilization/screens/MatingBatchCreate'
import MatingDetail from '../features/fertilization/screens/MatingDetail'
import MatingList from '../features/fertilization/screens/MatingList'
import {
    INVENTORY_PERMISSIONS,
    hasInventoryPermission,
} from '../features/inventory/inventoryPermissions'
import { INVENTORY_ROUTES } from '../features/inventory/routes'
import CryoInventoryList from '../features/inventory/screens/CryoInventoryList'
import EmbryoPackageDetail from '../features/inventory/screens/EmbryoPackageDetail'
import InventoryMovementCreate from '../features/inventory/screens/InventoryMovementCreate'
import InventoryMovementHistory from '../features/inventory/screens/InventoryMovementHistory'
import StorageLocationDetail from '../features/inventory/screens/StorageLocationDetail'
import { useOrganization } from '../features/organizations/OrganizationContext'
import {
    OPU_PERMISSIONS,
    hasOpuPermission,
} from '../features/opu/opuPermissions'
import { OPU_ROUTES } from '../features/opu/routes'
import OocyteCollectionDetail from '../features/opu/screens/OocyteCollectionDetail'
import OpuCollectionBatch from '../features/opu/screens/OpuCollectionBatch'
import OpuSessionCreate from '../features/opu/screens/OpuSessionCreate'
import OpuSessionDetail from '../features/opu/screens/OpuSessionDetail'
import OpuSessionList from '../features/opu/screens/OpuSessionList'
import SemenBatchDetail from '../features/semen/screens/SemenBatchDetail'
import SemenBatchSearch from '../features/semen/screens/SemenBatchSearch'
import { TRANSFER_ROUTES } from '../features/transfers/routes'
import PregnancyFollowUps from '../features/transfers/screens/PregnancyFollowUps'
import PregnancyCheckCapture from '../features/transfers/screens/PregnancyCheckCapture'
import RecipientCycleCreate from '../features/transfers/screens/RecipientCycleCreate'
import RecipientCycleDetail from '../features/transfers/screens/RecipientCycleDetail'
import RecipientCycleList from '../features/transfers/screens/RecipientCycleList'
import TransferDetail from '../features/transfers/screens/TransferDetail'
import {
    TRANSFER_PERMISSIONS,
    hasTransferPermission,
} from '../features/transfers/transferPermissions'
import Pive from '../screens/Pive'
import Cabecalho from '../screens/PIVE-sections/Cabecalho'
import FivInfo from '../screens/PIVE-sections/FivInfo'
import ColetaOocitos from '../screens/PIVE-sections/ColetaOocitos'
import Embrioes from '../screens/PIVE-sections/Embrioes'
import Cultivo from '../screens/PIVE-sections/Cultivo'
import Descartados from '../screens/PIVE-sections/Descartados'
import Congelados from '../screens/PIVE-sections/Congelados'
import Transferidos from '../screens/PIVE-sections/Transferidos'
import Transferencia from '../screens/PIVE-sections/Transferencia'
import Prenhez from '../screens/PIVE-sections/Prenhez'
import ReceptorasPrenhaz from '../screens/PIVE-sections/ReceptorasPrenhaz.js'

const Stack = createStackNavigator()

export default function PiveStack() {
    const { activeOrganizationId } = useOrganization()
    const effectiveContextQuery = useEffectiveContextQuery({
        organizationId: activeOrganizationId,
    })
    const showTargetOpu = effectiveContextQuery.isSuccess && hasOpuPermission(
        effectiveContextQuery.data,
        OPU_PERMISSIONS.READ
    )
    const showTargetTransfers = effectiveContextQuery.isSuccess &&
        hasTransferPermission(
            effectiveContextQuery.data,
            TRANSFER_PERMISSIONS.READ
        )
    const showTargetInventory = effectiveContextQuery.isSuccess &&
        hasInventoryPermission(
            effectiveContextQuery.data,
            INVENTORY_PERMISSIONS.READ
        )
    const showTargetDocuments = effectiveContextQuery.isSuccess &&
        hasDocumentPermission(
            effectiveContextQuery.data,
            DOCUMENT_PERMISSIONS.READ
        )
    const showTargetCorrections = effectiveContextQuery.isSuccess &&
        hasCorrectionPermission(
            effectiveContextQuery.data,
            CORRECTION_PERMISSIONS.READ
        )
    const showTargetShipments = effectiveContextQuery.isSuccess &&
        hasDistributionPermission(
            effectiveContextQuery.data,
            DISTRIBUTION_PERMISSIONS.SHIPMENT_READ
        )
    const showTargetRecalls = effectiveContextQuery.isSuccess &&
        hasDistributionPermission(
            effectiveContextQuery.data,
            DISTRIBUTION_PERMISSIONS.RECALL_READ
        )
    const showTargetDataQuality = effectiveContextQuery.isSuccess &&
        canReadDataQuality(effectiveContextQuery.data)
    const renderPive = React.useCallback(props => (
        <Pive
            {...props}
            showTargetCorrections={showTargetCorrections}
            showTargetDataQuality={showTargetDataQuality}
            showTargetDocuments={showTargetDocuments}
            showTargetOpu={showTargetOpu}
            showTargetTransfers={showTargetTransfers}
            showTargetInventory={showTargetInventory}
            showTargetRecalls={showTargetRecalls}
            showTargetShipments={showTargetShipments}
        />
    ), [
        showTargetCorrections,
        showTargetDataQuality,
        showTargetDocuments,
        showTargetInventory,
        showTargetOpu,
        showTargetRecalls,
        showTargetShipments,
        showTargetTransfers,
    ])

    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name="Pive">
                {renderPive}
            </Stack.Screen>
            <Stack.Screen
                name={OPU_ROUTES.LIST}
                component={OpuSessionList}
            />
            <Stack.Screen
                name={OPU_ROUTES.DETAIL}
                component={OpuSessionDetail}
                options={{ headerShown: true, title: 'OPU' }}
            />
            <Stack.Screen
                name={OPU_ROUTES.CREATE}
                component={OpuSessionCreate}
                options={{ headerShown: true, title: 'Nova OPU' }}
            />
            <Stack.Screen
                name={OPU_ROUTES.COLLECTION_BATCH}
                component={OpuCollectionBatch}
                options={{ headerShown: true, title: 'Coletas da OPU' }}
            />
            <Stack.Screen
                name={OPU_ROUTES.COLLECTION_DETAIL}
                component={OocyteCollectionDetail}
                options={{ headerShown: true, title: 'Coleta de oócitos' }}
            />
            <Stack.Screen
                name={MATING_ROUTES.LIST}
                component={MatingList}
                options={{ headerShown: true, title: 'Fertilizações' }}
            />
            <Stack.Screen
                name={MATING_ROUTES.BATCH_CREATE}
                component={MatingBatchCreate}
                options={{ headerShown: true, title: 'Nova alocação' }}
            />
            <Stack.Screen
                name={MATING_ROUTES.DETAIL}
                component={MatingDetail}
                options={{ headerShown: true, title: 'Fertilização' }}
            />
            <Stack.Screen
                name={MATING_ROUTES.SEMEN_BATCH_SEARCH}
                component={SemenBatchSearch}
                options={{ headerShown: true, title: 'Lotes de sêmen' }}
            />
            <Stack.Screen
                name={MATING_ROUTES.SEMEN_BATCH_DETAIL}
                component={SemenBatchDetail}
                options={{ headerShown: true, title: 'Lote de sêmen' }}
            />
            <Stack.Screen
                name={EMBRYO_ROUTES.LIST}
                component={EmbryoList}
                options={{ headerShown: true, title: 'Embriões' }}
            />
            <Stack.Screen
                name={EMBRYO_ROUTES.BATCH_IDENTIFY}
                component={EmbryoBatchIdentify}
                options={{ headerShown: true, title: 'Identificar embriões' }}
            />
            <Stack.Screen
                name={EMBRYO_ROUTES.DETAIL}
                component={EmbryoDetail}
                options={{ headerShown: true, title: 'Embrião' }}
            />
            <Stack.Screen
                name={EMBRYO_ROUTES.TRACEABILITY}
                component={EmbryoTraceability}
                options={{ headerShown: true, title: 'Rastreabilidade' }}
            />
            <Stack.Screen
                name={TRANSFER_ROUTES.RECIPIENT_CYCLE_LIST}
                component={RecipientCycleList}
                options={{ headerShown: true, title: 'Ciclos de receptoras' }}
            />
            <Stack.Screen
                name={TRANSFER_ROUTES.RECIPIENT_CYCLE_CREATE}
                component={RecipientCycleCreate}
                options={{ headerShown: true, title: 'Novo ciclo' }}
            />
            <Stack.Screen
                name={TRANSFER_ROUTES.RECIPIENT_CYCLE_DETAIL}
                component={RecipientCycleDetail}
                options={{ headerShown: true, title: 'Ciclo da receptora' }}
            />
            <Stack.Screen
                name={TRANSFER_ROUTES.TRANSFER_DETAIL}
                component={TransferDetail}
                options={{ headerShown: true, title: 'Transferência' }}
            />
            <Stack.Screen
                name={TRANSFER_ROUTES.PREGNANCY_FOLLOW_UPS}
                component={PregnancyFollowUps}
                options={{ headerShown: true, title: 'Acompanhamentos' }}
            />
            <Stack.Screen
                name={TRANSFER_ROUTES.PREGNANCY_CHECK_CAPTURE}
                component={PregnancyCheckCapture}
                options={{ headerShown: true, title: 'Checagem gestacional' }}
            />
            <Stack.Screen
                name={INVENTORY_ROUTES.LIST}
                component={CryoInventoryList}
                options={{ headerShown: true, title: 'Inventário criogênico' }}
            />
            <Stack.Screen
                name={INVENTORY_ROUTES.PACKAGE_DETAIL}
                component={EmbryoPackageDetail}
                options={{ headerShown: true, title: 'Package' }}
            />
            <Stack.Screen
                name={INVENTORY_ROUTES.MOVEMENT_HISTORY}
                component={InventoryMovementHistory}
                options={{ headerShown: true, title: 'Movimentos' }}
            />
            <Stack.Screen
                name={INVENTORY_ROUTES.MOVEMENT_CREATE}
                component={InventoryMovementCreate}
                options={{ headerShown: true, title: 'Nova movimentação' }}
            />
            <Stack.Screen
                name={INVENTORY_ROUTES.STORAGE_LOCATION_DETAIL}
                component={StorageLocationDetail}
                options={{ headerShown: true, title: 'Local de armazenamento' }}
            />
            <Stack.Screen
                name={DOCUMENT_ROUTES.LIST}
                component={DocumentList}
                options={{ headerShown: true, title: 'Documentos' }}
            />
            <Stack.Screen
                name={DOCUMENT_ROUTES.DETAIL}
                component={DocumentDetail}
                options={{ headerShown: true, title: 'Documento' }}
            />
            <Stack.Screen
                name={CORRECTION_ROUTES.LIST}
                component={CorrectionList}
                options={{ headerShown: true, title: 'Solicitações de correção' }}
            />
            <Stack.Screen
                name={CORRECTION_ROUTES.DETAIL}
                component={CorrectionDetail}
                options={{ headerShown: true, title: 'Solicitação histórica' }}
            />
            <Stack.Screen
                name={DISTRIBUTION_ROUTES.SHIPMENT_LIST}
                component={ShipmentList}
                options={{ headerShown: true, title: 'Distribuição' }}
            />
            <Stack.Screen
                name={DISTRIBUTION_ROUTES.SHIPMENT_DETAIL}
                component={ShipmentDetail}
                options={{ headerShown: true, title: 'Remessa' }}
            />
            <Stack.Screen
                name={DISTRIBUTION_ROUTES.RECALL_LIST}
                component={RecallList}
                options={{ headerShown: true, title: 'Recalls' }}
            />
            <Stack.Screen
                name={DISTRIBUTION_ROUTES.RECALL_DETAIL}
                component={RecallDetail}
                options={{ headerShown: true, title: 'Recall' }}
            />
            <Stack.Screen
                name={DATA_QUALITY_ROUTES.LIST}
                component={DataQualityList}
                options={{ headerShown: true, title: 'Qualidade de dados' }}
            />
            <Stack.Screen name="Cabecalho" component={Cabecalho} />
            <Stack.Screen name="FivInfo" component={FivInfo} />
            <Stack.Screen name="ColetaOocitos" component={ColetaOocitos} />
            <Stack.Screen name="Embrioes" component={Embrioes} />
            <Stack.Screen name="Cultivo" component={Cultivo} />
            <Stack.Screen name="Descartados" component={Descartados} />
            <Stack.Screen name="Congelados" component={Congelados} />
            <Stack.Screen name="Transferidos" component={Transferidos} />
            <Stack.Screen name="Transferencia" component={Transferencia} />
            <Stack.Screen name="Prenhez" component={Prenhez} />
            <Stack.Screen name="ReceptorasPrenhaz" component={ReceptorasPrenhaz} />
        </Stack.Navigator>
    )
}

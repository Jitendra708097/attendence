/**
 * @module GeoFenceDrawer
 * @description Google Maps geofence drawing modal.
 */
import { Modal, Button, Row, Col, Card, Statistic } from 'antd';

export default function GeoFenceDrawer({ open, branch, onSave, onCancel, loading }) {
  return (
    <Modal
      title={`Set Geofence - ${branch?.name}`}
      open={open}
      onCancel={onCancel}
      width="90vw"
      style={{ top: 0 }}
      bodyStyle={{ padding: '16px', height: '70vh' }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={() => onSave()}>
          Save Geofence
        </Button>,
      ]}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Latitude" value={branch?.latitude} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Longitude" value={branch?.longitude} />
          </Card>
        </Col>
      </Row>

      <div style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
          Google Maps integration - Draw polygon on map to set geofence boundaries
        </p>
      </div>
    </Modal>
  );
}

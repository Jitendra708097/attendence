/**
 * @module RegApprovalModal  * @description Modal for regularisation approval with evidence.  */// 
 import { Modal, Form, Input, Button, Space, Card, Image, Row, Col, message } from 'antd';
 import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
 export default function RegApprovalModal({ open,  reg,  onApprove,  onReject,  onClose,  loading,}) 
 {  const [form] = Form.useForm();
     if (!reg) return null;
       const handleApprove = async () => {
            try {
                  const values = await form.validateFields();
                        onApprove(reg.id, values);
                       } catch (error) {
                              console.error('Validation failed:', error);
                            }   };    const handleReject = async () => {     try {       const values = await form.validateFields();       onReject(reg.id, values);     } catch (error) {       console.error('Validation failed:', error);     }   };    return (     <Modal       title="Regularisation Approval"       open={open}       onCancel={onClose}       width={700}       footer={[         <Button key="close" onClick={onClose}>           Close         </Button>,         <Button key="reject" danger onClick={handleReject} loading={loading} icon={<CloseOutlined />}>           Reject         </Button>,         <Button key= "approve " type= "primary " onClick={handleApprove} loading={loading} icon={<CheckOutlined />}>           Approve         </Button>,       ]}     >       <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>         <Col xs={12}>           <Card size= "small ">             <p>Employee: {reg.employeeName}</p>           </Card>         </Col>         <Col xs={12}>           <Card size= "small ">             <p>Date: {reg.date}</p>           </Card>         </Col>       </Row>        <h4>Evidence</h4>       {reg.evidenceUrl && (         <Image src={reg.evidenceUrl} width={200} style={{ marginBottom: 16 }} />       )}        <h4>Original Record</h4>       <Card size= "small " style={{ marginBottom: 16 }}>         <p>Check-in: {reg.originalCheckIn}</p>         <p>Check-out: {reg.originalCheckOut}</p>       </Card>        <h4>Requested Correction</h4>       <Card size= "small " style={{ marginBottom: 16 }}>         <p>Check-in: {reg.requestedCheckIn}</p>         <p>Check-out: {reg.requestedCheckOut}</p>       </Card>        <Form form={form} layout= "vertical ">         <Form.Item name= "note " label= "Admin Note ">           <Input.TextArea rows={3} placeholder= "Your decision notes " />         </Form.Item>       </Form>     </Modal>   ); } 
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner, Alert, Button, Form, Modal } from "react-bootstrap";

const HolidayTable = () => {
  const [holidays, setHolidays] = useState([]);
  const [holidayPlans, setHolidayPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignFormData, setAssignFormData] = useState({ options: "" });
  const [currentHolidayId, setCurrentHolidayId] = useState(null);
  const [assignedPlan, setAssignedPlan] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalDetails, setModalDetails] = useState(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/holidays");
        setHolidays(response.data);
      } catch (err) {
        setError("Failed to fetch holidays.");
      } finally {
        setLoading(false);
      }
    };

    const storedPlans = localStorage.getItem("assignedPlans");
    if (storedPlans) {
      setAssignedPlan(JSON.parse(storedPlans));
    }

    const storedHolidayPlans = localStorage.getItem("holidayPlans");
    if (storedHolidayPlans) {
      setHolidayPlans(JSON.parse(storedHolidayPlans));
    }

    fetchHolidays();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssignFormData({ ...assignFormData, [name]: value });

    if (name === "options") {
      fetchHolidayPlans(value);
    }
  };

  const fetchHolidayPlans = async (selectedOption) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/holidayplans?option=${selectedOption}`);
      const plansData = response.data;
      setHolidayPlans((prev) => ({ ...prev, [selectedOption]: plansData }));
      localStorage.setItem("holidayPlans", JSON.stringify({ ...holidayPlans, [selectedOption]: plansData }));
    } catch (err) {
      setError("Failed to fetch holiday plans.");
    }
  };

  const handleLeavePolicyClick = (holidayId) => {
    setCurrentHolidayId(holidayId);
    setAssignFormData({ options: "" }); // Reset form data
    setShowModal(true); // Show the modal
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const formattedData = {
        ...assignFormData,
        holidayId: currentHolidayId,
      };
      const response = await axios.post("http://localhost:5000/api/holidayplan", formattedData);
      const planDetails = response.data;

      alert("Holiday plan assigned successfully!");

      setAssignedPlan((prev) => {
        const newAssignedPlan = {
          ...prev,
          [currentHolidayId]: {
            option: assignFormData.options,
            details: planDetails,
          },
        };
        localStorage.setItem("assignedPlans", JSON.stringify(newAssignedPlan));
        return newAssignedPlan;
      });

      setAssignFormData({ options: "" });
      setCurrentHolidayId(null);
      setShowModal(false); // Close modal after submission
    } catch (error) {
      setError("Failed to assign holiday plan.");
    }
  };

  const handleClearPlans = (holidayId) => {
    setAssignedPlan((prev) => {
      const updatedPlans = { ...prev };
      delete updatedPlans[holidayId]; // Remove only the specific holiday plan
      localStorage.setItem("assignedPlans", JSON.stringify(updatedPlans)); // Update localStorage
      return updatedPlans;
    });
  };

  const handleModalShow = (holidayId) => {
    setModalDetails(assignedPlan[holidayId]);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalDetails(null);
  };

  if (loading)
    return (
      <Spinner animation="border" role="status" className="m-3">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    );

  if (error)
    return (
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );

  return (
    <div className="m-3">
      <h3 className="title-text">Holiday Plans</h3>

      <Table striped bordered hover responsive className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Organisation ID</th>
            <th>Location</th>
            <th>Sublocation</th>
            <th>SubSublocation</th>
            <th>Actions</th>
            <th>See Plans</th>
          </tr>
        </thead>
        <tbody>
          {holidays.map((holiday) => (
            <tr key={holiday.id}>
              <td>{holiday.id}</td>
              <td>{holiday.organisation_id}</td>
              <td>{holiday.location}</td>
              <td>{holiday.sublocation || "N/A"}</td>
              <td>{holiday.subsublocation || "N/A"}</td>
              <td>
                <Button variant="info" onClick={() => handleLeavePolicyClick(holiday.id)}>
                  Leave Policy
                </Button>
                <Button variant="danger" onClick={() => handleClearPlans(holiday.id)} className="ms-2">
                  Clear Plans
                </Button>
              </td>
              <td>
                {assignedPlan[holiday.id] ? (
                  <div>
                    <strong>{assignedPlan[holiday.id].option}</strong><br />
                    <Button variant="link" onClick={() => handleModalShow(holiday.id)}>
                      View Details
                    </Button>
                  </div>
                ) : (
                  "No plans assigned"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal for assigning plans */}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Holiday Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formOptions">
              <Form.Label>Options</Form.Label>
              <Form.Control
                as="select"
                name="options"
                value={assignFormData.options}
                onChange={handleInputChange}
                required
              >
                <option value="">Select an option...</option>
                <option value="Option1">Option 1</option>
                <option value="Option2">Option 2</option>
                <option value="Option3">Option 3</option>
                <option value="Option4">Option 4</option>
                <option value="Option5">Option 5</option>
                <option value="Option6">Option 6</option>
              </Form.Control>
            </Form.Group>
            <Button variant="success" type="submit">
              Assign
            </Button>
            <Button variant="secondary" onClick={handleModalClose}>
              Cancel
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal for displaying details */}
      <Modal show={showModal && modalDetails} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Assigned Plan Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalDetails ? (
            <div>
              <h5>Option: {modalDetails.option}</h5>
              <p>Org ID: {modalDetails.details.organisation_id}</p>
              <p>Location: {modalDetails.details.location}</p>
              <p>Sublocation: {modalDetails.details.sublocation || "N/A"}</p>
              <p>SubSublocation: {modalDetails.details.subsublocation || "N/A"}</p>
              {/* Display holiday plans for the selected option in a table */}
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Sr. No</th>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Holiday</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {holidayPlans[modalDetails.option]?.map((plan) => (
                    <tr key={plan.sr_no}>
                      <td>{plan.sr_no}</td>
                      <td>{plan.date}</td>
                      <td>{plan.day}</td>
                      <td>{plan.name}</td>
                      <td>{plan.details}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan="5">No plans available for this option.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          ) : (
            <p>No details available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HolidayTable;

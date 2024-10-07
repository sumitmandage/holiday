import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Table } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const AddHoliday = () => {
    const [formData, setFormData] = useState({
        option: '',
    });
    const [holidayPlans, setHolidayPlans] = useState([]);
    const [error, setError] = useState(null);
    const [file, setFile] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const fetchHolidayPlans = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/holidayplans');
            setHolidayPlans(response.data);
        } catch (error) {
            setError('Failed to fetch holiday plans.');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const formattedData = {
                date: new Date(formData.date).toISOString().split('T')[0],
                day: formData.day, // Ensure you have this input in your form
                name: formData.name, // Ensure you have this input in your form
                details: formData.details, // Ensure you have this input in your form
                option: formData.option,
            };
            await axios.post('http://localhost:5000/api/holidayplans', formattedData);
            alert("Holiday added successfully!");
            setFormData({ option: '' });
            fetchHolidayPlans();
        } catch (error) {
            console.error(error);
            setError('Failed to add holiday plan.');
        }
    };

    const handleBulkUpload = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const submitBulkUpload = async () => {
        if (!file) {
            alert("Please select a file to upload.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const binaryStr = e.target.result;
            const workbook = XLSX.read(binaryStr, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Skip the header row (first row) and filter out invalid rows
            const holidays = jsonData.slice(1).map(row => ({
                Date: row[0], // Adjust this based on your Excel structure
                Day: row[1], // Assuming Day is in the second column
                Name: row[2], // Assuming Name is in the third column
                Details: row[3] // Assuming Details is in the fourth column
            })).filter(row => row.Date && row.Date !== 'Sr.No.'); // Filter out any rows without a date or the header

            try {
                await Promise.all(holidays.map(async (holiday) => {
                    const dateValue = holiday.Date;

                    // Ensure the date is in a valid format
                    const parsedDate = new Date(dateValue);
                    if (isNaN(parsedDate.getTime())) {
                        throw new Error(`Invalid date: ${dateValue}`);
                    }

                    // Format the date to YYYY-MM-DD for the backend
                    const formattedDate = parsedDate.toISOString().split('T')[0];

                    const formattedData = {
                        date: formattedDate, // Use the formatted date
                        day: holiday.Day, // Use the day from the row
                        name: holiday.Name, // Use the name from the row
                        details: holiday.Details, // Use the details from the row
                        option: formData.option // Include selected option
                    };

                    await axios.post('http://localhost:5000/api/holidayplans', formattedData);
                }));
                alert("Holidays added successfully!");
                fetchHolidayPlans();
                setFile(null);
            } catch (error) {
                console.error(error);
                setError('Failed to upload holiday plans: ' + error.message);
            }
        };
        reader.readAsBinaryString(file);
    };

    useEffect(() => {
        fetchHolidayPlans();
    }, []);

    // Filter holiday plans based on selected option
    const filteredPlans = formData.option
        ? holidayPlans.filter(plan => plan.option === formData.option)
        : [];

    return (
        <div className="m-3">
            <h3 className="title-text">Add Holiday Plan</h3>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit} className="my-3">
                <Form.Group controlId="formOption">
                    <Form.Label>Options</Form.Label>
                    <Form.Control
                        as="select"
                        name="option"
                        value={formData.option}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Select an option</option>
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                        <option value="option3">Option 3</option>
                        <option value="option4">Option 4</option>
                        <option value="option5">Option 5</option>
                        <option value="option6">Option 6</option>
                    </Form.Control>
                </Form.Group>

                {formData.option && (
                    <Form.Group className="my-3">
                        <Form.Label>Upload Excel File</Form.Label>
                        <Form.Control type="file" accept=".xlsx, .xls" onChange={handleBulkUpload} />
                        <Button variant="primary" onClick={submitBulkUpload} className="mt-2">Upload</Button>
                    </Form.Group>
                )}

                
            </Form>

            <h4 className="mt-4">Holiday Plans</h4>
            {formData.option ? (
                <Table striped bordered hover responsive className="mt-3">
                    <thead>
                        <tr>
                            <th>Sr. No</th>
                            <th>Date</th>
                            <th>Day</th>
                            <th>Holiday</th> {/* Changed from Day to Holiday */}
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPlans.length > 0 ? (
                            filteredPlans.map((plan, index) => (
                                <tr key={plan.sr_no}>
                                    <td>{index + 1}</td>
                                    <td>{plan.date.split('T')[0]}</td>
                                    <td>{plan.day}</td>
                                    <td>{plan.name}</td> {/* Ensure this is the correct data for the Holiday column */}
                                    <td>{plan.details}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center">No holiday plans available for this option.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            ) : (
                <div className="mt-3">Please select an option to view holiday plans.</div>
            )}
        </div>
    );
};

export default AddHoliday;
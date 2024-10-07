// App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'; // Change 'Switch' to 'Routes'
import HolidayTable from './components/holiday'; // Main table component
import AddHoliday from './components/AddHoliday'; // Component for adding holidays
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap styles are imported

const App = () => {
    return (
        <Router>
            <div>
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <Link className="navbar-brand" to="/">Holiday Plans</Link>
                    <div className="collapse navbar-collapse">
                        <div className="navbar-nav">
                            <Link className="nav-item nav-link" to="/">Home</Link>
                            <Link className="nav-item nav-link" to="/add-holiday">Add Holiday</Link> 
                         </div>
                    </div>
                </nav>
                <Routes> {/* Replace 'Switch' with 'Routes' */}
                    <Route path="/" element={<HolidayTable />} /> {/* Use 'element' prop instead of 'component' */}
                    <Route path="/add-holiday" element={<AddHoliday />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;

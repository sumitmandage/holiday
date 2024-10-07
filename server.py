from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime

app = Flask(__name__)

# Configure the database URI for MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'mysql+mysqlconnector://root:Sumit%40777@localhost/new_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
CORS(app)

# Define the Holiday model
class Holiday(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    organisation_id = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    sublocation = db.Column(db.String(100))
    subsublocation = db.Column(db.String(100))

# Define the HolidayPlans model
class HolidayPlans(db.Model):
    sr_no = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date = db.Column(db.Date, nullable=False)
    day = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    details = db.Column(db.String(255), nullable=True)
    option = db.Column(db.String(50), nullable=False)  # Field for option

# Define the Assignment model
class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    holiday_id = db.Column(db.Integer, db.ForeignKey('holiday.id'), nullable=False)
    option = db.Column(db.String(50), nullable=False)

@app.route('/api/holidays', methods=['GET', 'POST'])
def manage_holidays():
    if request.method == 'GET':
        holidays = Holiday.query.all()
        return jsonify([{
            'id': h.id,
            'organisation_id': h.organisation_id,
            'location': h.location,
            'sublocation': h.sublocation,
            'subsublocation': h.subsublocation,
        } for h in holidays]), 200
    
    elif request.method == 'POST':
        data = request.json
        required_fields = ['organisation_id', 'location']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        new_holiday = Holiday(
            organisation_id=data['organisation_id'],
            location=data['location'],
            sublocation=data.get('sublocation'),
            subsublocation=data.get('subsublocation')
        )
        
        db.session.add(new_holiday)
        db.session.commit()
        return jsonify({
            'id': new_holiday.id,
            'organisation_id': new_holiday.organisation_id,
            'location': new_holiday.location,
            'sublocation': new_holiday.sublocation,
            'subsublocation': new_holiday.subsublocation
        }), 201

@app.route('/api/holidayplans', methods=['GET', 'POST'])
def manage_holidayplans():
    if request.method == 'GET':
        option = request.args.get('option')  # Get the option parameter
        if option:
            plans = HolidayPlans.query.filter_by(option=option).all()  # Filter by option
        else:
            plans = HolidayPlans.query.all()
        
        return jsonify([{
            'sr_no': p.sr_no,
            'date': p.date.isoformat(),
            'day': p.day,
            'name': p.name,
            'details': p.details,
            'option': p.option  # Include option in response
        } for p in plans]), 200
    
    elif request.method == 'POST':
        data = request.json
        required_fields = ['date', 'name', 'details', 'option']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Ensure date_str is a string before processing
        date_str = str(data['date'])
        
        # Date conversion and day calculation
        try:
            date_value = datetime.strptime(date_str, '%Y-%m-%d').date()
            day_name = date_value.strftime('%A')  # Get the day name
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400

        new_plan = HolidayPlans(
            date=date_value,
            day=day_name,  # Use calculated day name
            name=data['name'],
            details=data['details'],
            option=data['option']
        )
        
        db.session.add(new_plan)
        db.session.commit()
        return jsonify({
            'sr_no': new_plan.sr_no,
            'date': new_plan.date.isoformat(),
            'day': new_plan.day,
            'name': new_plan.name,
            'details': new_plan.details,
            'option': new_plan.option
        }), 201

@app.route('/api/holidayplan', methods=['POST'])
def assign_holiday_plan():
    data = request.json
    required_fields = ['holidayId', 'options']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    # Create the assignment
    assignment = Assignment(
        holiday_id=data['holidayId'],
        option=data['options']
    )
    
    db.session.add(assignment)
    db.session.commit()

    # Retrieve the holiday details
    holiday = Holiday.query.get(data['holidayId'])
    if holiday is None:
        return jsonify({'error': 'Holiday not found'}), 404

    return jsonify({
        'message': 'Holiday plan assigned successfully!',
        'organisation_id': holiday.organisation_id,
        'location': holiday.location,
        'sublocation': holiday.sublocation,
        'subsublocation': holiday.subsublocation,
    }), 201

@app.route('/api/assigned_plans', methods=['GET'])
def get_assigned_plans():
    holiday_id = request.args.get('holiday_id')
    if not holiday_id:
        return jsonify({'error': 'Missing holiday ID'}), 400

    assignments = Assignment.query.filter_by(holiday_id=holiday_id).all()
    assigned_options = [assignment.option for assignment in assignments]

    return jsonify(assigned_options), 200

if __name__ == '__main__':
    with app.app_context():
        # db.drop_all()  # Comment this out in production
        db.create_all()  # Create new tables
    app.run(debug=True)

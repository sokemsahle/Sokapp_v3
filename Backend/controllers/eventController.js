const mysql = require('mysql2/promise');

// Database configuration - import from main server config
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sokapptest',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getAllEvents = async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    
    let query = `
      SELECT e.*, u.full_name as creator_name 
      FROM events e 
      LEFT JOIN users u ON e.created_by = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ` AND e.category = ?`;
      params.push(category);
    }

    const offset = (page - 1) * limit;
    query += ` ORDER BY e.start_time ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [events] = await connection.execute(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM events e WHERE 1=1`;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (category) {
      countQuery += ` AND e.category = ?`;
      countParams.push(category);
    }

    const [{ total }] = await connection.execute(countQuery, countParams);

    res.json({
      success: true,
      message: 'Events retrieved successfully',
      data: {
        events,
        pagination: {
          page: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  } finally {
    await connection.end();
  }
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Public
exports.getUpcomingEvents = async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const { limit = 10 } = req.query;
    
    const [events] = await connection.execute(`
      SELECT e.*, u.full_name as creator_name 
      FROM events e 
      LEFT JOIN users u ON e.created_by = u.id 
      WHERE e.start_time >= NOW()
      ORDER BY e.start_time ASC 
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      message: 'Upcoming events retrieved successfully',
      data: {
        events
      }
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upcoming events'
    });
  } finally {
    await connection.end();
  }
};

// @desc    Get events by date range
// @route   GET /api/events/range
// @access  Public
exports.getEventsByDateRange = async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const [events] = await connection.execute(`
      SELECT e.*, u.full_name as creator_name 
      FROM events e 
      LEFT JOIN users u ON e.created_by = u.id 
      WHERE e.start_time BETWEEN ? AND ?
      ORDER BY e.start_time ASC
    `, [startDate, endDate]);

    res.json({
      success: true,
      message: 'Events retrieved successfully',
      data: {
        events
      }
    });
  } catch (error) {
    console.error('Get events by range error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  } finally {
    await connection.end();
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const { id } = req.params;
    
    const [events] = await connection.execute(`
      SELECT e.*, u.full_name as creator_name 
      FROM events e 
      LEFT JOIN users u ON e.created_by = u.id 
      WHERE e.id = ?
    `, [id]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event retrieved successfully',
      data: {
        event: events[0]
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  } finally {
    await connection.end();
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Public
exports.createEvent = async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const { title, description, start_time, end_time, location, reminder_time, category, attendee_user_ids } = req.body;

    // Validate required fields
    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Title, start time, and end time are required'
      });
    }

    // Validate dates
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Create event (created_by set to 1 as default user for now)
    const [result] = await connection.execute(`
      INSERT INTO events (title, description, start_time, end_time, location, reminder_time, category, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, description || null, start_time, end_time, location || null, reminder_time || null, category || 'general', 1]);

    // If attendee_user_ids provided, store them (you can implement this later)
    // For now, we'll just log it
    if (attendee_user_ids && attendee_user_ids.length > 0) {
      console.log('Event attendees:', attendee_user_ids);
    }

    const [newEvent] = await connection.execute(`
      SELECT e.*, u.full_name as creator_name 
      FROM events e 
      LEFT JOIN users u ON e.created_by = u.id 
      WHERE e.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: newEvent[0]
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  } finally {
    await connection.end();
  }
};

// @desc    Update existing event
// @route   PUT /api/events/:id
// @access  Public
exports.updateEvent = async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const { id } = req.params;
    const { title, description, start_time, end_time, location, reminder_time, category, attendee_user_ids } = req.body;

    // Check if event exists
    const [existing] = await connection.execute('SELECT * FROM events WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await connection.execute(`
      UPDATE events 
      SET title = ?, description = ?, start_time = ?, end_time = ?, 
          location = ?, reminder_time = ?, category = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      title || existing[0].title,
      description !== undefined ? description : existing[0].description,
      start_time || existing[0].start_time,
      end_time || existing[0].end_time,
      location !== undefined ? location : existing[0].location,
      reminder_time !== undefined ? reminder_time : existing[0].reminder_time,
      category || existing[0].category,
      id
    ]);

    // If attendee_user_ids provided, update them (implement later)
    if (attendee_user_ids) {
      console.log('Updated event attendees:', attendee_user_ids);
    }

    const [updatedEvent] = await connection.execute(`
      SELECT e.*, u.full_name as creator_name 
      FROM events e 
      LEFT JOIN users u ON e.created_by = u.id 
      WHERE e.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        event: updatedEvent[0]
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating event'
    });
  } finally {
    await connection.end();
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Public
exports.deleteEvent = async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const { id } = req.params;
    
    // Check if event exists
    const [existing] = await connection.execute('SELECT * FROM events WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await connection.execute('DELETE FROM events WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting event'
    });
  } finally {
    await connection.end();
  }
};

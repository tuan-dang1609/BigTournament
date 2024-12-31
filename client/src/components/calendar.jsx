import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react'; // import FullCalendar component
import dayGridPlugin from '@fullcalendar/daygrid'; // for Month view
import interactionPlugin from '@fullcalendar/interaction'; // for user interactions
import moment from 'moment';
import axios from 'axios';

const Calendar = () => {
  const [events, setEvents] = useState([]);

  const SHEET_TITLE_CALENDER = 'Sheet1';
  const SHEET_RANGE_CALENDER = 'A2:F30';
  const SHEET_ID_CALENDER = '1KZyEwotS-18GSOuLPee4vI7Vyz0lGrGIkJZ1tDNFn9E';
  const FULL_URL_CALENDER = `https://docs.google.com/spreadsheets/d/${SHEET_ID_CALENDER}/gviz/tq?sheet=${SHEET_TITLE_CALENDER}&range=${SHEET_RANGE_CALENDER}`;
  useEffect(()=>{
    document.title="Lịch trình giải đấu"
  })
  const fetchEvents = async () => {
    try {
      const res = await axios.get(FULL_URL_CALENDER);
      const data = JSON.parse(res.data.substr(47).slice(0, -2));

      const eventsData = data.table.rows.map((row) => {
        const rowData = row.c;
        return {
          title: rowData[0]?.v || 'No Title',
          start: rowData[4]?.v || moment().format(),
          end: rowData[5]?.v || moment().format(),
          color: `#${rowData[3]?.v || '000000'}`,
        };
      });

      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval); // Clean up the interval
  }, []);

  return (
    <div id="calendar" className='mt-28 mb-5 lg:mx-8 mx-3'>
      <h3 className='lg:text-4xl text-3xl font-bold text-base-content text-center my-5'>Lịch trình giải đấu 2025</h3>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="vi"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth',
        }}
        events={events}
        editable={false}
        navLinks={true}
        eventLimit={true}
      />
    </div>
  );
};

export default Calendar;

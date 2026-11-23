import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiVideo,
  FiX,
  FiTrash2,
} from 'react-icons/fi';

import '../../styles/AdminPages.css';
import calendarService from '../../services/calendarService';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

const pad = (number) =>
  String(number).padStart(2, '0');

const Calendar = () => {

  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [showModal, setShowModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    date: '',
    title: '',
    link: '',
    type: 'MEETING',
    assignedTo: [],
  });

  const [telecallers, setTelecallers] =
    useState([]);

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  // =====================================================
  // USER ROLE
  // =====================================================

  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem('user') || '{}'
      );
    } catch {
      return {};
    }
  }, []);

  const role = String(
    user?.role || ''
  ).toUpperCase();

  const canManageEvents =
    role === 'SUPER_ADMIN' ||
    role === 'ADMIN';

  // =====================================================
  // MONTH RANGE
  // =====================================================

  const getDateRange = () => {

    const from =
      `${year}-${pad(month + 1)}-01`;

    const lastDay = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const to =
      `${year}-${pad(month + 1)}-${pad(lastDay)}`;

    return {
      from,
      to,
    };
  };

  // =====================================================
  // LOAD CALENDAR
  // =====================================================

  const loadEvents = async () => {

    try {

      setLoading(true);
      setError('');

      const {
        from,
        to,
      } = getDateRange();

      console.log(
        'Loading calendar events:',
        { from, to }
      );

      const response =
        await calendarService.getEvents(
          from,
          to
        );

      console.log(
        'Calendar response:',
        response
      );

      setEvents(
        Array.isArray(response)
          ? response
          : []
      );

    } catch (err) {

      console.error(
        'Calendar load error:',
        err
      );

      setError(
        err?.message ||
        'Failed to load calendar'
      );

      setEvents([]);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadEvents();
  }, [year, month]);

  // =====================================================
  // LOAD TELECALLERS
  // =====================================================

  useEffect(() => {

    if (!canManageEvents) {
      return;
    }

    const loadTelecallers =
      async () => {

        try {

          const response =
            await calendarService.getTelecallers();

          setTelecallers(
            Array.isArray(response)
              ? response
              : []
          );

        } catch (err) {

          console.error(
            'Failed to load telecallers:',
            err
          );

          setTelecallers([]);
        }
      };

    loadTelecallers();

  }, [canManageEvents]);

  // =====================================================
  // EVENTS BY DATE
  // =====================================================

  const eventsByDate = useMemo(() => {

    const eventMap = {};

    events.forEach((event) => {

      if (!event?.date) {
        return;
      }

      if (!eventMap[event.date]) {
        eventMap[event.date] = [];
      }

      eventMap[event.date].push(event);
    });

    return eventMap;

  }, [events]);

  // =====================================================
  // CALENDAR GRID
  // =====================================================

  const calendarGrid = useMemo(() => {

    const firstDayOfMonth =
      new Date(year, month, 1);

    const startOffset =
      (firstDayOfMonth.getDay() + 6) % 7;

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate();

    const cells = [];

    for (
      let i = 0;
      i < startOffset;
      i++
    ) {
      cells.push(null);
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      cells.push(day);
    }

    while (
      cells.length % 7 !== 0
    ) {
      cells.push(null);
    }

    return cells;

  }, [year, month]);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (day) =>
    `${year}-${pad(month + 1)}-${pad(day)}`;

  const todayString =
    new Date().toISOString().slice(0, 10);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const goPreviousMonth = () => {

    setCurrentDate(
      new Date(
        year,
        month - 1,
        1
      )
    );
  };

  const goNextMonth = () => {

    setCurrentDate(
      new Date(
        year,
        month + 1,
        1
      )
    );
  };

  // =====================================================
  // ADD EVENT
  // =====================================================

  const openAddModal = () => {

    const todayValue =
      new Date()
        .toISOString()
        .slice(0, 10);

    setForm({
      date: todayValue,
      title: '',
      link: '',
      type: 'MEETING',
      assignedTo: [],
    });

    setShowModal(true);
  };

  const closeModal = () => {

    setShowModal(false);

    setForm({
      date: '',
      title: '',
      link: '',
      type: 'MEETING',
      assignedTo: [],
    });
  };

  // =====================================================
  // ASSIGNED TELECALLERS
  // =====================================================

  const toggleTelecaller = (
    username
  ) => {

    setForm((previous) => {

      const exists =
        previous.assignedTo.includes(
          username
        );

      return {
        ...previous,

        assignedTo: exists
          ? previous.assignedTo.filter(
              (item) =>
                item !== username
            )
          : [
              ...previous.assignedTo,
              username,
            ],
      };
    });
  };

  // =====================================================
  // SAVE EVENT
  // =====================================================

  const handleSave = async () => {

    if (!form.date) {
      alert(
        'Please select a date'
      );
      return;
    }

    if (
      !form.title ||
      !form.title.trim()
    ) {
      alert(
        'Please enter event title'
      );
      return;
    }

    try {

      setSaving(true);

      await calendarService.createEvent({
        date: form.date,
        title: form.title.trim(),
        link: form.link.trim() || null,
        type: form.type,
        assignedTo: form.assignedTo,
      });

      closeModal();

      await loadEvents();

    } catch (err) {

      console.error(
        'Calendar create error:',
        err
      );

      alert(
        err?.message ||
        'Failed to create event'
      );

    } finally {

      setSaving(false);
    }
  };

  // =====================================================
  // DELETE EVENT
  // =====================================================

  const handleDelete = async (
    event,
    mouseEvent
  ) => {

    mouseEvent.stopPropagation();

    if (event.readOnly) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${event.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      await calendarService.deleteEvent(
        event.id
      );

      await loadEvents();

    } catch (err) {

      console.error(
        'Delete error:',
        err
      );

      alert(
        err?.message ||
        'Failed to delete event'
      );
    }
  };

  // =====================================================
  // EVENT CLICK
  // =====================================================

  const handleEventClick = (
    event
  ) => {

    if (event.link) {
      window.open(
        event.link,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="ap-page">

      {/* HEADER */}

      <div className="ap-header">

        <div>

          <div className="ap-title">
            Calendar
          </div>

          <div className="ap-subtitle">
            Live meetings, follow-ups and holidays
          </div>

        </div>

        {canManageEvents && (

          <button
            className="ap-btn-primary"
            onClick={openAddModal}
          >

            <FiPlus />

            Add Event

          </button>

        )}

      </div>

      {/* ERROR */}

      {error && (

        <div
          style={{
            marginBottom: 12,
            color: '#dc2626',
            fontWeight: 600,
          }}
        >

          {error}

        </div>

      )}

      {/* MONTH NAVIGATION */}

      <div
        className="ap-card"
        style={{
          marginBottom: 16,
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >

          <button
            className="ap-btn-icon"
            onClick={goPreviousMonth}
            title="Previous month"
          >

            <FiChevronLeft />

          </button>

          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
            }}
          >

            {MONTH_NAMES[month]} {year}

          </div>

          <button
            className="ap-btn-icon"
            onClick={goNextMonth}
            title="Next month"
          >

            <FiChevronRight />

          </button>

        </div>

      </div>

      {/* CALENDAR */}

      {loading ? (

        <div
          className="ap-card"
          style={{
            padding: 30,
            textAlign: 'center',
          }}
        >

          Loading calendar...

        </div>

      ) : (

        <div className="cal-grid">

          {DAYS_OF_WEEK.map(
            (day) => (

              <div
                key={day}
                className="cal-dow"
              >

                {day}

              </div>

            )
          )}

          {calendarGrid.map(
            (day, index) => {

              const dateString =
                day
                  ? formatDate(day)
                  : null;

              const dayEvents =
                dateString
                  ? eventsByDate[
                      dateString
                    ] || []
                  : [];

              const isToday =
                dateString ===
                todayString;

              return (

                <div
                  key={index}
                  className={`
                    cal-cell
                    ${!day ? 'outside' : ''}
                    ${isToday ? 'today' : ''}
                  `}
                >

                  {day && (

                    <div
                      className="cal-daynum"
                    >

                      {day}

                    </div>

                  )}

                  {dayEvents
                    .slice(0, 3)
                    .map(
                      (
                        event,
                        eventIndex
                      ) => (

                        <div
                          key={
                            event.id ||
                            eventIndex
                          }
                          className={`
                            cal-event
                            ${String(
                              event.type ||
                              ''
                            ).toLowerCase()}
                          `}
                          title={
                            event.title
                          }
                          onClick={() =>
                            handleEventClick(
                              event
                            )
                          }
                          style={{
                            cursor:
                              event.link
                                ? 'pointer'
                                : 'default',
                          }}
                        >

                          {String(
                            event.type
                          ).toUpperCase() ===
                            'MEETING' && (

                            <FiVideo
                              size={10}
                              style={{
                                marginRight: 3,
                              }}
                            />

                          )}

                          <span
                            style={{
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                              whiteSpace:
                                'nowrap',
                              flex: 1,
                            }}
                          >

                            {event.title}

                          </span>

                          {canManageEvents &&
                            !event.readOnly && (

                              <FiTrash2
                                size={11}
                                onClick={(
                                  e
                                ) =>
                                  handleDelete(
                                    event,
                                    e
                                  )
                                }
                                style={{
                                  marginLeft: 4,
                                  cursor:
                                    'pointer',
                                }}
                              />

                            )}

                        </div>

                      )
                    )}

                  {dayEvents.length >
                    3 && (

                    <div
                      style={{
                        fontSize: 10,
                        color:
                          'var(--text-light)',
                        marginTop: 2,
                      }}
                    >

                      +
                      {dayEvents.length -
                        3}
                      {' '}more

                    </div>

                  )}

                </div>

              );
            }
          )}

        </div>

      )}

      {/* ADD EVENT MODAL */}

      {showModal && (

        <div
          className="ap-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="ap-modal-box"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className="ap-modal-title"
            >

              <span>
                Add Calendar Event
              </span>

              <button
                className="ap-btn-icon"
                onClick={closeModal}
              >

                <FiX />

              </button>

            </div>

            {/* DATE */}

            <div className="ap-form-group">

              <label>
                Date *
              </label>

              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      date:
                        event.target.value,
                    })
                  )
                }
              />

            </div>

            {/* TITLE */}

            <div className="ap-form-group">

              <label>
                Title *
              </label>

              <input
                value={form.title}
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      title:
                        event.target.value,
                    })
                  )
                }
                placeholder="Event title"
              />

            </div>

            {/* TYPE */}

            <div className="ap-form-group">

              <label>
                Event Type
              </label>

              <select
                value={form.type}
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      type:
                        event.target.value,
                    })
                  )
                }
              >

                <option value="MEETING">
                  Meeting
                </option>

                <option value="HOLIDAY">
                  Holiday
                </option>

                <option value="EVENT">
                  Event
                </option>

              </select>

            </div>

            {/* LINK */}

            <div className="ap-form-group">

              <label>
                Meeting Link
              </label>

              <input
                value={form.link}
                onChange={(event) =>
                  setForm(
                    (previous) => ({
                      ...previous,
                      link:
                        event.target.value,
                    })
                  )
                }
                placeholder="https://meet.google.com/..."
              />

            </div>

            {/* TELECALLERS */}

            {telecallers.length > 0 && (

              <div className="ap-form-group">

                <label>
                  Assign Telecallers
                </label>

                <div
                  style={{
                    maxHeight: 150,
                    overflowY: 'auto',
                    border:
                      '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 8,
                  }}
                >

                  {telecallers.map(
                    (telecaller) => {

                      const username =
                        telecaller.username;

                      const checked =
                        form.assignedTo.includes(
                          username
                        );

                      return (

                        <label
                          key={username}
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 8,
                            padding:
                              '6px 4px',
                            cursor:
                              'pointer',
                          }}
                        >

                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={() =>
                              toggleTelecaller(
                                username
                              )
                            }
                          />

                          <span>

                            {telecaller.fullName ||
                              username}

                            {telecaller.employeeId &&
                              ` (${telecaller.employeeId})`}

                          </span>

                        </label>

                      );
                    }
                  )}

                </div>

                <small
                  style={{
                    color: '#64748b',
                  }}
                >

                  Leave empty to make
                  the event visible to all
                  telecallers.

                </small>

              </div>

            )}

            {/* ACTIONS */}

            <div
              className="ap-form-actions"
            >

              <button
                className="ap-btn-outline"
                onClick={closeModal}
                disabled={saving}
              >

                Cancel

              </button>

              <button
                className="ap-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >

                {saving
                  ? 'Saving...'
                  : 'Add Event'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Calendar;
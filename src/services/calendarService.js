import api from './api';

export const calendarService = {
  getEvents: (from, to) =>
    api.calendar.getEvents(from, to),

  create: (data) =>
    api.calendar.create(data),

  update: (id, data) =>
    api.calendar.update(id, data),

  remove: (id) =>
    api.calendar.remove(id),

  getTelecallers: () =>
    api.calendar.getTelecallers(),
};

export default calendarService;
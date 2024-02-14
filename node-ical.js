var ical = require('./ical')
  , fs = require('fs')

exports.parseFile = function(filename){
  return ical.parseICS(fs.readFileSync(filename, 'utf8'))
}

var rrule = require('rrule').RRule

ical.objectHandlers['RRULE'] = function(val, params, curr, stack, line){
  curr.rrule = line;
  return curr
}
var originalEnd = ical.objectHandlers['END'];
ical.objectHandlers['END'] = function (val, params, curr, stack) {
	// Recurrence rules are only valid for VEVENT, VTODO, and VJOURNAL.
	// More specifically, we need to filter the VCALENDAR type because we might end up with a defined rrule
	// due to the subtypes.
	if ((val === "VEVENT") || (val === "VTODO") || (val === "VJOURNAL")) {
		if (curr.rrule) {
			var rule = curr.rrule.replace('RRULE:', '');
			if (rule.indexOf('DTSTART') === -1) {
        // reduction the DTSTART
        if (curr.start && curr.start.val) {
          let DTSTART = ['DTSTART'].concat(curr.start.params).join(';') + ':' + curr.start.val;
          curr.rrule = DTSTART + '\n;' + curr.rrule;
        }
			}

      try {
        curr.rrule = rrule.fromString(rule);
      } catch (e) {
        console.error('ERROR when parse rrule: ', curr.rrule);
      }
		}
	}
  return originalEnd.call(this, val, params, curr, stack);
}

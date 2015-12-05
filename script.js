$( document ).ready(function() {
  // semi-globals
  var log = []; // stores AJAX logs

  $('#request-jwt').click(function(e) {
    e.preventDefault();
    var toSend = {
      "email": $('#auth-username').val(),
      "password": $('#auth-password').val(),
      "rememberMe": true
    };

    $.ajax({
      url: buildUri('/api/v0/auth/jwt/signIn'),
      contentType: 'application/json',
      data: JSON.stringify(toSend),
      method: 'POST'
    }).done(function(data) {
      setJwt(data.token);
    });
  });

  $('#jwt-token-manual').click(function(e){
    e.preventDefault();
    var token = window.prompt('Set JSON Web Token to...', getJwt());
    if(token != null) {
      setJwt(token);
    }
  });

  $('#request-send').click(function(e) {
    // If bool is true, merge objToMergeIn into target and return it
    var conditionalExtend = function(bool, objToMergeIn, target) {
      if(bool) {
        return $.extend(target, objToMergeIn);
      } else {
        return target;
      }
    };
    e.preventDefault();
    var method = $('#request-method').val();
    var endpoint = $('#request-endpoint').val();
    var data = $('#request-data').val();
    var sendJwt = $('#request-send-jwt').prop('checked');
    var sendJsonContentType = $('#request-contenttype-json').prop('checked');
    var sendData = $('#request-do-send-data').prop('checked');

    var ajaxOptions = {
      url: buildUri(endpoint),
      method: method
    };

    ajaxOptions = conditionalExtend(sendJsonContentType,
      { contentType: 'application/json' }, ajaxOptions);

    ajaxOptions = conditionalExtend(sendJwt, { headers: {
      'X-Auth-Token': getJwt() } }, ajaxOptions);

    ajaxOptions = conditionalExtend(sendData, { data: data }, ajaxOptions);

    $.ajax(ajaxOptions).complete(function(data) {
      $('#request-response-data').text(data.responseText);
      $('#request-response-data').data('json', data.responseJSON);
      $('#request-response-label').html(buildLabelFromStatusCode(data.status,
        data.statusText));
      if(data.responseJSON) {
        $('#request-response-data').text(
          JSON.stringify(data.responseJSON, null, 2)
        )
      }
    });

  });

  // log as JSON to the console
  $('#request-response-log-json').click(function(e) {
    e.preventDefault();
    console.log($('#request-response-data').data('json'));
  });

  var buildLabelFromStatusCode = function(statusCode, statusText) {
    var labelClass = function(statusCode) {
      if(statusCode < 200) return "label-info";
      if(statusCode < 300) return "label-success";
      if(statusCode < 400) return "label-warning";
      return "label-danger";
    };
    return '<span class="label ' + labelClass(statusCode) + '">' +
      statusCode + ' ' + statusText + '</span>';
  }

  // Get JSON Web Token
  var getJwt = function() {
    return $('#jwt-token').text();
  };

  // Set JSON Web Token
  var setJwt = function(token) {
    $('#jwt-token').text(token);
  };

  // Build a URI
  // location is a string like '/api/test/'
  var buildUri = function(location) {
    return $('#config-domain').val().slice(0,-1) + location;
  };

  // Global AJAX hooks
  $(document).ajaxComplete(function(event, jqXhr, ajaxOptions) {
    var logEntry = {
      request: {
        url: ajaxOptions.url,
        method: ajaxOptions.method,
        contentType: ajaxOptions.contentType,
        data: ajaxOptions.data
      },
      response: {
        text: jqXhr.responseText,
        status: jqXhr.status,
        statusText: jqXhr.statusText
      },
      timestampComplete: event.timeStamp
    };
    log.push(logEntry);
    logUpdated();
    setLogDetails(logEntry);
  });

  // Call after log variable has changed
  var logUpdated = function() { setLog(log); };

  // Update the log in the DOM
  // God this is ugly
  var setLog = function(log) {
    // Convert arg to string and add leading zero if arg is not two characters
    var addLeadingZero = function(arg) {
      if(('' + arg).length == 1) { return '0' + arg; } else { return '' + arg; }
    };
    var buildRow = function(timestamp, time, method, endpoint, statusCode, statusText) {
      return '<tr data-timestamp="' + timestamp + '"><td>' + time + '<td>' +
        method + '<td>' + endpoint + '<td>' + buildLabelFromStatusCode(
          statusCode, statusText) +
          '<td><a href="#" class="open-log-details">Details</a>' + '</tr>';
    };

    var table = $('<table class="table table-striped"></table');
    table.append('<th>Time<th>Method<th>Endpoint<th>Status<th>Extra');
    $('#log').html(table);
    $.each(log, function(idx, entry) {
      var date = new Date(entry.timestampComplete);
      var time = addLeadingZero(date.getHours()) + ':' + addLeadingZero(
        date.getMinutes()) + ':' + addLeadingZero(date.getSeconds());
      var endpoint = entry.request.url.replace(buildUri(''), ''); // remove location
      var row = buildRow(entry.timestampComplete, time, entry.request.method,
        endpoint, entry.response.status, entry.response.statusText);
      table.append(row);
    });

    $('.open-log-details').click(function(e) {
      var findLogForTimestamp = function(timestamp) {
        return log.filter(function(entry) {
          return timestamp == entry.timestampComplete
        })[0];
      };
      e.preventDefault();
      setLogDetails(findLogForTimestamp(
        $(this).parent().parent().data('timestamp')
      ));
    });
  };

  // Set the details view for the log in the DOM
  var setLogDetails = function(logObject) {
    $('#log-details-timestamp').text(logObject.timestampComplete);
    $('#log-details-timestamp-human').text(new Date(logObject.timestampComplete));
    $('#log-details-request-url').text(logObject.request.url);
    $('#log-details-request-method').text(logObject.request.method);
    $('#log-details-request-data').text(logObject.request.data);
    $('#log-details-request-content-type').text(logObject.request.contentType);
    $('#log-details-response-text').text(logObject.response.text);
    $('#log-details-response-status').text(logObject.response.status);
    $('#log-details-response-status-text').text(logObject.response.statusText);
  };
});

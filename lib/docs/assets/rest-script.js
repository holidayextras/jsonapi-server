
var resources = [].concat.apply([ ], data.namespaces.map(function(i) { return i.resources; }));

var restParams = $("#rest-params");
var restAdditional = $("#rest-additional");
var restResource = $("#rest-resource");
var restRoute = $("#rest-route");
var restSubmit = $("#rest-submit");
var restBack = $("#rest-back");
var restRequest = $("#rest-request");
var restLoading = $("#rest-loading");
var restResponse = $("#rest-response");

window.doRestModalFor = function(resourceName, type) {
  restResource.val(resourceName);
  restRoute.val(type);
  redrawRest();
  restBack.hide();
  restSubmit.show();
  $("#rest-1").show();
  $("#rest-2").hide();
  $("#rest").modal();
};

window.redrawRest = function() {
  var targetResource = restResource.val();
  var targetRoute = restRoute.val();
  var resource = resources.filter(function(i) {
    return i.name == targetResource;
  }).pop();

  $("#rest-params").empty();
  var fields = [ ];

  if (targetRoute == "search") {
    fields = resource.searchParams;
  } else if (targetRoute == "create") {
    fields = resource.userAttributes;
  } else if (targetRoute == "update") {
    fields = resource.userAttributes;
  }

  fields.forEach(function(item) {
    $("#rest-params").append(createInputs(item));
  });
};

window.createInputs = function(item) {
  var div1 = document.createElement("div");
  div1.className = "input-"+item.name+" form-group";

  var label = document.createElement("label");
  label.className = "col-sm-2 control-label";
  label.innerHTML = item.name;
  label.for = "input-"+item.name;

  var div2 = document.createElement("div");
  div2.className = "col-sm-10";

  var input = document.createElement("input");
  input.className = "form-control";
  input.id = "input-"+item.name;
  input.name = item.name;
  input.placeholder = item.example;

  div2.appendChild(input);
  div1.appendChild(label);
  div1.appendChild(div2);

  return div1;
};

window.makeRequest = function() {
  restSubmit.hide();
  restBack.show();
  $("#rest-1").hide();

  var apiRequest = buildApiRequest();
  $.ajax(apiRequest).done(function(data, result, xhr) {
    drawResponse(data, xhr);
    restResponse.show();
    restLoading.hide();
  });
  drawRequest(apiRequest);

  $("#rest-2").show();
  restResponse.hide();
  restLoading.show();
};

window.buildApiRequest = function() {
  var targetResource = restResource.val();
  var targetRoute = restRoute.val();
  var resource = resources.filter(function(i) {
    return i.name == targetResource;
  }).pop();

  var fields = $("form").serializeArray();

  var url = "/:type/:id";
  if (targetRoute == "search" || targetRoute == "create") url="/:type";
  var methods = {
    search: "GET",
    find: "GET",
    create: "POST",
    update: "PATCH",
    delete: "DELETE"
  };

  url = url.replace(":type", targetResource);
  url = url.replace(":id", (fields.filter(function(i) {
    return i.name == "id";
  }).pop() || { }).value);
  url = "/rest"+url;

  return {
    url: url,
    method: methods[targetRoute],
    contentType: "application/vnd.api+json",
    data: ""
  };
};

window.drawRequest = function(apiRequest) {
  var text = apiRequest.method+" "+apiRequest.url + " HTTP/1.1\n";
  text += "Host: ??\n";
  text += "Content-Type: application/vnd.api+json\n\n";
  if (apiRequest.data) text += JSON.stringify(apiRequest.data,null,2);

  text = text.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
  restRequest.html(text);
};

window.drawResponse = function(data, xhr) {
  var text = "HTTP/1.1 "+xhr.status+" "+xhr.statusText+"\n";
  text += xhr.getAllResponseHeaders();
  text += "\n";
  text += JSON.stringify(data,null,2);

  text = text.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
  restResponse.html(text);
};

restSubmit.on("click", makeRequest)
restResource.on("change", redrawRest);
restRoute.on("change", redrawRest);
restBack.on("click", function() {
  $("#rest-1").show();
  $("#rest-2").hide();
  restBack.hide();
  restSubmit.show();
});

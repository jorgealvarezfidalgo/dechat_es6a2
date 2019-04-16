package com.uniovi.endpoints;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import com.uniovi.repositories.MarksRepository;
import com.uniovi.soap.ws.GetMarksRequest;
import com.uniovi.soap.ws.GetMarksResponse;

@Endpoint
public class MarkEndpoint {
	private static final String NAMESPACE_URI = "http://uniovi.com/soap/ws";
	private MarksRepository markRepository;

	@Autowired
	public MarkEndpoint(MarksRepository markRepository) {
		this.markRepository = markRepository;
	}

	@PayloadRoot(namespace = NAMESPACE_URI, localPart = "getMarksRequest")
	@ResponsePayload
	public GetMarksResponse getMarks(@RequestPayload GetMarksRequest request) {
		GetMarksResponse response = new GetMarksResponse();
		response.setUser(markRepository.findAllByUser(request.getDni()));
		return response;
	}
}

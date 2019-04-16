package com.uniovi.repositories;

import javax.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import com.uniovi.soap.ws.Mark;
import com.uniovi.soap.ws.User;
import java.util.HashMap;
import java.util.Map;
import org.springframework.util.Assert;

@Component
public class MarksRepository {
	private static final Map<String, User> marks = new HashMap<>();

	@PostConstruct
	public void initData() {
		User student = new User();
		student.setName("Jose");
		student.setDni("75999999X");
		Mark mark1 = new Mark();
		mark1.setDescription("SDI");
		mark1.setScore(10);
		Mark mark2 = new Mark();
		mark2.setDescription("DLP");
		mark2.setScore(8);
		Mark mark3 = new Mark();
		mark3.setDescription("IP");
		mark3.setScore(8);
		student.getMark().add(mark1);
		student.getMark().add(mark2);
		student.getMark().add(mark3);
		marks.put(student.getDni(), student);
	}

	public User findAllByUser(String dni) {
		Assert.notNull(dni, "The user's DNI must not be null");
		return marks.get(dni);
	}
}

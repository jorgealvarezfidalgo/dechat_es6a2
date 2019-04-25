package computerdatabase

import scala.concurrent.duration._

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.jdbc.Predef._

class TestFirstDechat extends Simulation {

	val httpProtocol = http
		.baseUrl("https://arquisoft.github.io")
		.inferHtmlResources(BlackList(""".*\.css""", """.*\.js""", """.*\.ico"""), WhiteList())
		.acceptHeader("image/webp,image/apng,image/*,*/*;q=0.8")
		.acceptEncodingHeader("gzip, deflate")
		.acceptLanguageHeader("es-ES,es;q=0.9")
		.userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36")

	val headers_0 = Map(
		"Accept" -> "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
		"Upgrade-Insecure-Requests" -> "1")

	val scn = scenario("DeChat-ES-6A-II-test")
		// Inicio
		.exec(http("request_0")
			.get("/dechat_es6a2/images")
			.headers(headers_0)
			.check(status.is(404)))
		.pause(1)

		.exec(http("request_1")
			.get("/dechat_es4a/videos")
			.resources(http("request_2")
			.check(status.is(404)))
		.pause(40)

		.exec(http("request_2")
			.get("/dechat_es6a2"))
		.pause(59)

		.exec(http("request_3")
			.get("/dechat_es6a2/documentation")
			.headers(headers_0))

	setUp(scn.inject(atOnceUsers(1))).protocols(httpProtocol)
}

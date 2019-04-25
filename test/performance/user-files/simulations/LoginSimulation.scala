package computerdatabase

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class LoginSimulation extends Simulation {

  val httpConf = http
    .baseURL("http://localhost:3000") // Here is the root for all relative URLs

  val loginScenario = scenario("Login") // A scenario is a chain of requests and pauses

    .exec(http("Login API") // Here's an example of a POST request
      .post("/api/login")
      .formParam("username", "username")
      .formParam("password", "password"))

  setUp(loginScenario.inject(atOnceUsers(100)).protocols(httpConf))
}
